import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import QRCode from "https://esm.sh/qrcode@1.5.3?target=deno";

// Logical coordinate space that SignaturePad.tsx normalizes every captured
// stroke point into (top-left origin, y increasing downward) regardless of
// the on-screen canvas size or device pixel ratio. Must stay in sync with
// SIGNATURE_BOX in src/components/ui/SignaturePad.tsx.
export const SIGNATURE_BOX = { width: 600, height: 200 };

// Bumped whenever the rendering logic (layout, signer-name resolution,
// typography) changes in a way that would make a re-render of the same
// immutable agreement/signature data look different from a prior artifact.
// Printed in the PDF footer/certificate and stored on each PDF artifact row.
export const PDF_RENDERER_VERSION = "v2";

type StrokePoint = { x: number; y: number; t: number };
type Strokes = StrokePoint[][];

export interface ExecutedAgreementPdfInput {
  contractId: string;
  partnerCode: string;
  partnerName: string;
  agreementVersion: string;
  agreementText: string;
  agreementSha256: string;
  commissionRate: number;
  partnerSignerName: string | null;
  partnerSignerTitle: string | null;
  partnerSignedAt: string;
  partnerSignatureStrokes: Strokes;
  partnerAuthMethod: string;
  partnerSignatureEventId: string | null;
  companySignerName: string;
  companySignerTitle: string;
  companySignedAt: string;
  companySignatureStrokes: Strokes;
  companyAuthMethod: string;
  companySignatureEventId: string | null;
  verificationCode: string;
  verificationUrl: string;
  pdfGeneratedAt: string;
}

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 14;
const BODY_SIZE = 10;
const HEADING_SIZE = 14;

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const out: string[] = [];
  for (const rawLine of text.split("\n")) {
    if (rawLine.trim() === "") {
      out.push("");
      continue;
    }
    const words = rawLine.split(/\s+/);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
        out.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

function drawSignatureBox(page: PDFPage, strokes: Strokes, x: number, yTop: number, boxWidth: number, boxHeight: number) {
  page.drawRectangle({
    x,
    y: yTop - boxHeight,
    width: boxWidth,
    height: boxHeight,
    borderColor: rgb(0.75, 0.75, 0.75),
    borderWidth: 0.75,
  });
  // Uniform scale (never independent X/Y) so the signature is never
  // stretched, then center the drawn strokes inside the box.
  const scale = Math.min(boxWidth / SIGNATURE_BOX.width, boxHeight / SIGNATURE_BOX.height);
  const drawnWidth = SIGNATURE_BOX.width * scale;
  const drawnHeight = SIGNATURE_BOX.height * scale;
  const originX = x + (boxWidth - drawnWidth) / 2;
  const originY = yTop - (boxHeight - drawnHeight) / 2;
  const ink = rgb(0.05, 0.05, 0.2);
  for (const stroke of strokes) {
    if (stroke.length === 1) {
      const p0 = stroke[0];
      page.drawCircle({ x: originX + p0.x * scale, y: originY - p0.y * scale, size: 1, color: ink });
      continue;
    }
    for (let i = 1; i < stroke.length; i += 1) {
      const a = stroke[i - 1];
      const b = stroke[i];
      page.drawLine({
        start: { x: originX + a.x * scale, y: originY - a.y * scale },
        end: { x: originX + b.x * scale, y: originY - b.y * scale },
        thickness: 1.4,
        color: ink,
      });
    }
  }
}

export async function generateExecutedAgreementPdf(input: ExecutedAgreementPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const newPage = () => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN) newPage();
  };

  const drawHeading = (text: string) => {
    ensureSpace(HEADING_SIZE + 10);
    page.drawText(text, { x: MARGIN, y, size: HEADING_SIZE, font: boldFont, color: rgb(0.05, 0.05, 0.15) });
    y -= HEADING_SIZE + 8;
  };

  const drawParagraph = (text: string, size = BODY_SIZE, useFont = font, color = rgb(0.1, 0.1, 0.1)) => {
    const lines = wrapText(useFont, text, size, CONTENT_WIDTH);
    for (const line of lines) {
      ensureSpace(LINE_HEIGHT);
      if (line) page.drawText(line, { x: MARGIN, y, size, font: useFont, color });
      y -= LINE_HEIGHT;
    }
  };

  const drawLabelValue = (label: string, value: string, size = BODY_SIZE, lineHeight = LINE_HEIGHT) => {
    const valueLines = wrapText(font, value, size, CONTENT_WIDTH - boldFont.widthOfTextAtSize(label, size) - 6);
    ensureSpace(lineHeight * Math.max(1, valueLines.length));
    page.drawText(label, { x: MARGIN, y, size, font: boldFont, color: rgb(0.15, 0.15, 0.15) });
    const labelWidth = boldFont.widthOfTextAtSize(label, size);
    if (valueLines.length > 0) {
      page.drawText(valueLines[0], { x: MARGIN + labelWidth + 6, y, size, font, color: rgb(0.1, 0.1, 0.1) });
    }
    y -= lineHeight;
    for (let i = 1; i < valueLines.length; i += 1) {
      ensureSpace(lineHeight);
      page.drawText(valueLines[i], { x: MARGIN + labelWidth + 6, y, size, font, color: rgb(0.1, 0.1, 0.1) });
      y -= lineHeight;
    }
  };

  // Signer name is a hard requirement to never render as the literal string
  // "null" -- the caller must already have resolved a verified name, but this
  // is a last-resort guard so a render never surfaces that defect visibly.
  const safeName = (name: string | null | undefined) =>
    name && name.trim() ? name.trim() : "Signer Name Unavailable";

  const partnerSignerLine = `${safeName(input.partnerSignerName)}${input.partnerSignerTitle ? " -- " + input.partnerSignerTitle : ""}`;
  const companySignerLine = `${safeName(input.companySignerName)}${input.companySignerTitle ? " -- " + input.companySignerTitle : ""}`;

  drawHeading("AfraMedico Referral Partner Agreement -- Executed Copy");
  drawLabelValue("Contract ID:", input.contractId);
  drawLabelValue("Partner ID:", input.partnerCode);
  drawLabelValue("Partner Organization:", input.partnerName);
  drawLabelValue("Agreement Version:", input.agreementVersion);
  drawLabelValue("Status:", "Fully Executed");
  drawLabelValue("Commission Rate:", `${input.commissionRate}%`);
  drawLabelValue("Agreement Content SHA-256:", input.agreementSha256);
  y -= 6;

  drawHeading("Agreement Text");
  drawParagraph(input.agreementText);

  newPage();
  drawHeading("Signatures");

  // Compact, side-by-side signature columns.
  const SIG_BOX_WIDTH = 220;
  const SIG_BOX_HEIGHT = 70;
  const SIG_COL_GAP = 32;
  const SIG_META_SIZE = 8;
  const SIG_META_LINE = 11;
  const partnerColX = MARGIN;
  const companyColX = MARGIN + SIG_BOX_WIDTH + SIG_COL_GAP;

  const drawColumnMeta = (x: number, startY: number, rows: Array<[string, string]>): number => {
    let cy = startY;
    for (const [label, value] of rows) {
      const labelWidth = boldFont.widthOfTextAtSize(label, SIG_META_SIZE);
      const valueLines = wrapText(font, value, SIG_META_SIZE, SIG_BOX_WIDTH - labelWidth - 4);
      page.drawText(label, { x, y: cy, size: SIG_META_SIZE, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
      if (valueLines.length > 0) {
        page.drawText(valueLines[0], { x: x + labelWidth + 4, y: cy, size: SIG_META_SIZE, font, color: rgb(0.15, 0.15, 0.15) });
      }
      cy -= SIG_META_LINE;
      for (let i = 1; i < valueLines.length; i += 1) {
        page.drawText(valueLines[i], { x: x + labelWidth + 4, y: cy, size: SIG_META_SIZE, font, color: rgb(0.15, 0.15, 0.15) });
        cy -= SIG_META_LINE;
      }
    }
    return cy;
  };

  const partnerMetaRows: Array<[string, string]> = [
    ["Signer:", safeName(input.partnerSignerName)],
    ["Title:", input.partnerSignerTitle ?? "N/A"],
    ["Signed (UTC):", input.partnerSignedAt],
    ["Auth Method:", input.partnerAuthMethod],
  ];
  const companyMetaRows: Array<[string, string]> = [
    ["Signer:", safeName(input.companySignerName)],
    ["Title:", input.companySignerTitle ?? "N/A"],
    ["Signed (UTC):", input.companySignedAt],
    ["Auth Method:", input.companyAuthMethod],
  ];

  // Reserve the whole two-column block up front so pagination never splits
  // a signature box from its metadata mid-column.
  ensureSpace(LINE_HEIGHT + 4 + SIG_BOX_HEIGHT + 8 + SIG_META_LINE * 4 + 10);

  page.drawText("Partner Signature", { x: partnerColX, y, size: BODY_SIZE, font: boldFont, color: rgb(0.05, 0.05, 0.15) });
  page.drawText("AfraMedico Signature", { x: companyColX, y, size: BODY_SIZE, font: boldFont, color: rgb(0.05, 0.05, 0.15) });
  y -= LINE_HEIGHT + 4;

  const boxTopY = y;
  drawSignatureBox(page, input.partnerSignatureStrokes, partnerColX, boxTopY, SIG_BOX_WIDTH, SIG_BOX_HEIGHT);
  drawSignatureBox(page, input.companySignatureStrokes, companyColX, boxTopY, SIG_BOX_WIDTH, SIG_BOX_HEIGHT);
  y -= SIG_BOX_HEIGHT + 8;

  const partnerMetaEndY = drawColumnMeta(partnerColX, y, partnerMetaRows);
  const companyMetaEndY = drawColumnMeta(companyColX, y, companyMetaRows);
  y = Math.min(partnerMetaEndY, companyMetaEndY) - 6;

  newPage();
  drawHeading("Electronic Signature Certificate");
  const CERT_SIZE = 9;
  const CERT_LINE = 12;
  drawLabelValue("Contract ID:", input.contractId, CERT_SIZE, CERT_LINE);
  drawLabelValue("Partner ID:", input.partnerCode, CERT_SIZE, CERT_LINE);
  drawLabelValue("Agreement Version:", input.agreementVersion, CERT_SIZE, CERT_LINE);
  drawLabelValue("Status:", "Fully Executed", CERT_SIZE, CERT_LINE);
  drawLabelValue("Verification Code:", input.verificationCode, CERT_SIZE, CERT_LINE);
  drawLabelValue("PDF Renderer Version:", PDF_RENDERER_VERSION, CERT_SIZE, CERT_LINE);
  y -= 2;
  drawLabelValue("Partner Signer:", partnerSignerLine, CERT_SIZE, CERT_LINE);
  drawLabelValue("Partner Signature Timestamp (UTC):", input.partnerSignedAt, CERT_SIZE, CERT_LINE);
  drawLabelValue("Partner Authentication Method:", input.partnerAuthMethod, CERT_SIZE, CERT_LINE);
  drawLabelValue("Partner Signature Event ID:", input.partnerSignatureEventId ?? "n/a", CERT_SIZE, CERT_LINE);
  y -= 2;
  drawLabelValue("AfraMedico Signer:", companySignerLine, CERT_SIZE, CERT_LINE);
  drawLabelValue("AfraMedico Countersignature Timestamp (UTC):", input.companySignedAt, CERT_SIZE, CERT_LINE);
  drawLabelValue("AfraMedico Authentication Method:", input.companyAuthMethod, CERT_SIZE, CERT_LINE);
  drawLabelValue("AfraMedico Signature Event ID:", input.companySignatureEventId ?? "n/a", CERT_SIZE, CERT_LINE);
  y -= 2;
  drawLabelValue("Agreement Content SHA-256:", input.agreementSha256, CERT_SIZE, CERT_LINE);
  drawLabelValue("PDF Generated At (UTC):", input.pdfGeneratedAt, CERT_SIZE, CERT_LINE);
  drawLabelValue("Verification URL:", input.verificationUrl, CERT_SIZE, CERT_LINE);
  y -= 4;

  try {
    const qrDataUrl: string = await QRCode.toDataURL(input.verificationUrl, { margin: 1, width: 160 });
    const base64 = qrDataUrl.split(",")[1];
    const qrBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const qrImage = await doc.embedPng(qrBytes);
    ensureSpace(86);
    page.drawImage(qrImage, { x: MARGIN, y: y - 80, width: 80, height: 80 });
    y -= 86;
  } catch (qrError) {
    console.error("QR code embed failed", qrError);
  }

  const pages = doc.getPages();
  const pageCount = pages.length;
  for (let i = 0; i < pageCount; i += 1) {
    const p = pages[i];
    const footerText = `${input.contractId} | v${input.agreementVersion} | renderer ${PDF_RENDERER_VERSION} | Page ${i + 1} of ${pageCount} | ${input.verificationCode}`;
    const footerSize = 7;
    const footerWidth = font.widthOfTextAtSize(footerText, footerSize);
    p.drawText(footerText, {
      x: (PAGE_WIDTH - footerWidth) / 2,
      y: 24,
      size: footerSize,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  return doc.save();
}
