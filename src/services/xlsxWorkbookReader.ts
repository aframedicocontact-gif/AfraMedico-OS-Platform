type ZipEntry = {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  localHeaderOffset: number;
};

export type WorkbookSheet = {
  name: string;
  rows: string[][];
};

const decoder = new TextDecoder();

function readUint16(data: Uint8Array, offset: number) {
  return data[offset] | (data[offset + 1] << 8);
}

function readUint32(data: Uint8Array, offset: number) {
  return (
    data[offset] |
    (data[offset + 1] << 8) |
    (data[offset + 2] << 16) |
    (data[offset + 3] << 24)
  ) >>> 0;
}

function findEndOfCentralDirectory(data: Uint8Array) {
  for (let offset = data.length - 22; offset >= Math.max(0, data.length - 66000); offset -= 1) {
    if (readUint32(data, offset) === 0x06054b50) return offset;
  }
  throw new Error("Unable to read workbook ZIP directory.");
}

function readCentralDirectory(data: Uint8Array) {
  const eocdOffset = findEndOfCentralDirectory(data);
  const entryCount = readUint16(data, eocdOffset + 10);
  let offset = readUint32(data, eocdOffset + 16);
  const entries = new Map<string, ZipEntry>();

  for (let index = 0; index < entryCount; index += 1) {
    if (readUint32(data, offset) !== 0x02014b50) break;

    const compressionMethod = readUint16(data, offset + 10);
    const compressedSize = readUint32(data, offset + 20);
    const fileNameLength = readUint16(data, offset + 28);
    const extraLength = readUint16(data, offset + 30);
    const commentLength = readUint16(data, offset + 32);
    const localHeaderOffset = readUint32(data, offset + 42);
    const name = decoder.decode(data.slice(offset + 46, offset + 46 + fileNameLength));

    entries.set(name.replace(/\\/g, "/"), {
      name,
      compressionMethod,
      compressedSize,
      localHeaderOffset,
    });

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

async function inflateRaw(data: Uint8Array) {
  const DecompressionCtor = globalThis.DecompressionStream as unknown as
    | (new (format: string) => DecompressionStream)
    | undefined;

  if (!DecompressionCtor) {
    throw new Error("This browser cannot parse compressed XLSX files. Use a current Chrome, Edge, or Safari browser.");
  }

  const stream = new Blob([data]).stream().pipeThrough(new DecompressionCtor("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readZipEntry(data: Uint8Array, entries: Map<string, ZipEntry>, entryName: string) {
  const entry = entries.get(entryName);
  if (!entry) throw new Error(`Workbook entry not found: ${entryName}`);

  const offset = entry.localHeaderOffset;
  if (readUint32(data, offset) !== 0x04034b50) throw new Error(`Invalid workbook entry: ${entryName}`);

  const fileNameLength = readUint16(data, offset + 26);
  const extraLength = readUint16(data, offset + 28);
  const dataOffset = offset + 30 + fileNameLength + extraLength;
  const compressed = data.slice(dataOffset, dataOffset + entry.compressedSize);

  if (entry.compressionMethod === 0) return decoder.decode(compressed);
  if (entry.compressionMethod === 8) return decoder.decode(await inflateRaw(compressed));
  throw new Error(`Unsupported XLSX compression method ${entry.compressionMethod}.`);
}

function parseXml(xml: string) {
  return new DOMParser().parseFromString(xml, "application/xml");
}

function textContent(element: Element | null) {
  return element?.textContent ?? "";
}

function readSharedStrings(xml: string) {
  const doc = parseXml(xml);
  return Array.from(doc.getElementsByTagName("si")).map((item) =>
    Array.from(item.getElementsByTagName("t"))
      .map((text) => text.textContent ?? "")
      .join(""),
  );
}

function columnIndex(cellReference: string) {
  const letters = cellReference.replace(/[^A-Z]/gi, "").toUpperCase();
  let index = 0;
  for (const letter of letters) {
    index = index * 26 + letter.charCodeAt(0) - 64;
  }
  return Math.max(0, index - 1);
}

function readCell(cell: Element, sharedStrings: string[]) {
  const type = cell.getAttribute("t");
  const value = textContent(cell.getElementsByTagName("v")[0] ?? null);

  if (type === "s") {
    const sharedIndex = Number(value);
    return Number.isInteger(sharedIndex) ? sharedStrings[sharedIndex] ?? "" : "";
  }

  if (type === "inlineStr") {
    return Array.from(cell.getElementsByTagName("t"))
      .map((text) => text.textContent ?? "")
      .join("");
  }

  return value;
}

function readWorksheetRows(xml: string, sharedStrings: string[]) {
  const doc = parseXml(xml);
  return Array.from(doc.getElementsByTagName("row")).map((row) => {
    const values: string[] = [];

    Array.from(row.getElementsByTagName("c")).forEach((cell) => {
      const reference = cell.getAttribute("r") ?? "";
      values[columnIndex(reference)] = readCell(cell, sharedStrings);
    });

    return values.map((value) => value ?? "");
  });
}

function getRelationshipTargets(xml: string) {
  const doc = parseXml(xml);
  const targets = new Map<string, string>();

  Array.from(doc.getElementsByTagName("Relationship")).forEach((relationship) => {
    const id = relationship.getAttribute("Id");
    const target = relationship.getAttribute("Target");
    if (id && target) targets.set(id, target.replace(/^\/+/, ""));
  });

  return targets;
}

function resolveWorkbookTarget(target: string) {
  if (target.startsWith("xl/")) return target;
  return `xl/${target}`;
}

export async function readXlsxWorkbook(file: File): Promise<WorkbookSheet[]> {
  const data = new Uint8Array(await file.arrayBuffer());
  const entries = readCentralDirectory(data);
  const workbookXml = await readZipEntry(data, entries, "xl/workbook.xml");
  const workbookRelsXml = await readZipEntry(data, entries, "xl/_rels/workbook.xml.rels");
  const sharedStringsXml = entries.has("xl/sharedStrings.xml")
    ? await readZipEntry(data, entries, "xl/sharedStrings.xml")
    : "";
  const sharedStrings = sharedStringsXml ? readSharedStrings(sharedStringsXml) : [];
  const relTargets = getRelationshipTargets(workbookRelsXml);
  const workbookDoc = parseXml(workbookXml);

  return Array.from(workbookDoc.getElementsByTagName("sheet")).map((sheet) => {
    const name = sheet.getAttribute("name") ?? "Sheet";
    const relationshipId = sheet.getAttribute("r:id") ?? sheet.getAttribute("id") ?? "";
    const target = relTargets.get(relationshipId);
    if (!target) return { name, rows: [] };
    return { name, rows: [] as string[][], target: resolveWorkbookTarget(target) };
  }).reduce<Promise<WorkbookSheet[]>>(async (promise, sheet) => {
    const sheets = await promise;
    const target = (sheet as WorkbookSheet & { target?: string }).target;
    if (!target) return [...sheets, { name: sheet.name, rows: [] }];
    const worksheetXml = await readZipEntry(data, entries, target);
    return [...sheets, { name: sheet.name, rows: readWorksheetRows(worksheetXml, sharedStrings) }];
  }, Promise.resolve([]));
}
