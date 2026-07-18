import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import QRCode from "https://esm.sh/qrcode@1.5.3?target=deno";

// Logical coordinate space that SignaturePad.tsx normalizes every captured
// stroke point into (top-left origin, y increasing downward) regardless of
// the on-screen canvas size or device pixel ratio. Must stay in sync with
// SIGNATURE_BOX in src/components/ui/SignaturePad.tsx.
export const SIGNATURE_BOX = { width: 600, height: 200 };

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
  partnerSignerName: string;
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
  const scaleX = boxWidth / SIGNATURE_BOX.width;
  const scaleY = boxHeight / SIGNATURE_BOX.height;
  const ink = rgb(0.05, 0.05, 0.2);
  for (const stroke of strokes) {
    if (stroke.length === 1) {
      const p0 = stroke[0];
      page.drawCircle({ x: x + p0.x * scaleX, y: yTop - p0.y * scaleY, size: 1, color: ink });
      continue;
    }
    for (let i = 1; i < stroke.length; i += 1) {
      const a = stroke[i - 1];
      const b = stroke[i];
      page.drawLine({
        start: { x: x + a.x * scaleX, y: yTop - a.y * scaleY },
        end: { x: x + b.x * scaleX, y: yTop - b.y * scaleY },
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

  const drawLabelValue = (label: string, value: string) => {
    const valueLines = wrapText(font, value, BODY_SIZE, CONTENT_WIDTH - boldFont.widthOfTextAtSize(label, BODY_SIZE) - 6);
    ensureSpace(LINE_HEIGHT * Math.max(1, valueLines.length));
    page.drawText(label, { x: MARGIN, y, size: BODY_SIZE, font: boldFont, color: rgb(0.15, 0.15, 0.15) });
    const labelWidth = boldFont.widthOfTextAtSize(label, BODY_SIZE);
    if (valueLines.length > 0) {
      page.drawText(valueLines[0], { x: MARGIN + labelWidth + 6, y, size: BODY_SIZE, font, color: rgb(0.1, 0.1, 0.1) });
    }
    y -= LINE_HEIGHT;
    for (let i = 1; i < valueLines.length; i += 1) {
      ensureSpace(LINE_HEIGHT);
      page.drawText(valueLines[i], { x: MARGIN + labelWidth + 6, y, size: BODY_SIZE, font, color: rgb(0.1, 0.1, 0.1) });
      y -= LINE_HEIGHT;
    }
  };

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

  drawLabelValue("Partner Signer:", `${input.partnerSignerName}${input.partnerSignerTitle ? " -- " + input.partnerSignerTitle : ""}`);
  drawLabelValue("Partner Signed At (UTC):", input.partnerSignedAt);
  ensureSpace(90);
  drawSignatureBox(page, input.partnerSignatureStrokes, MARGIN, y, 260, 80);
  y -= 96;

  drawLabelValue("AfraMedico Signer:", `${input.companySignerName} -- ${input.companySignerTitle}`);
  drawLabelValue("AfraMedico Countersigned At (UTC):", input.companySignedAt);
  ensureSpace(90);
  drawSignatureBox(page, input.companySignatureStrokes, MARGIN, y, 260, 80);
  y -= 96;

  newPage();
  drawHeading("Electronic Signature Certificate");
  drawLabelValue("Contract ID:", input.contractId);
  drawLabelValue("Partner ID:", input.partnerCode);
  drawLabelValue("Agreement Version:", input.agreementVersion);
  drawLabelValue("Status:", "Fully Executed");
  drawLabelValue("Verification Code:", input.verificationCode);
  y -= 4;
  drawLabelValue("Partner Signer:", `${input.partnerSignerName}${input.partnerSignerTitle ? " -- " + input.partnerSignerTitle : ""}`);
  drawLabelValue("Partner Signature Timestamp (UTC):", input.partnerSignedAt);
  drawLabelValue("Partner Authentication Method:", input.partnerAuthMethod);
  drawLabelValue("Partner Signature Event ID:", input.partnerSignatureEventId ?? "n/a");
  y -= 4;
  drawLabelValue("AfraMedico Signer:", `${input.companySignerName} -- ${input.companySignerTitle}`);
  drawLabelValue("AfraMedico Countersignature Timestamp (UTC):", input.companySignedAt);
  drawLabelValue("AfraMedico Authentication Method:", input.companyAuthMethod);
  drawLabelValue("AfraMedico Signature Event ID:", input.companySignatureEventId ?? "n/a");
  y -= 4;
  drawLabelValue("Agreement Content SHA-256:", input.agreementSha256);
  drawLabelValue("PDF Generated At (UTC):", input.pdfGeneratedAt);
  drawLabelValue("Verification URL:", input.verificationUrl);

  try {
    const qrDataUrl: string = await QRCode.toDataURL(input.verificationUrl, { margin: 1, width: 200 });
    const base64 = qrDataUrl.split(",")[1];
    const qrBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const qrImage = await doc.embedPng(qrBytes);
    ensureSpace(110);
    page.drawImage(qrImage, { x: MARGIN, y: y - 100, width: 100, height: 100 });
    y -= 110;
  } catch (qrError) {
    console.error("QR code embed failed", qrError);
  }

  const pages = doc.getPages();
  const pageCount = pages.length;
  for (let i = 0; i < pageCount; i += 1) {
    const p = pages[i];
    const footerText = `${input.contractId} | v${input.agreementVersion} | Page ${i + 1} of ${pageCount} | ${input.verificationCode}`;
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
