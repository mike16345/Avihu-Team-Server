import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { IAgreementAnswer } from "../interfaces/IAgreement";
import { IFormQuestion } from "../interfaces/IForm";
import fs from "fs";
import rubikRegular from "../../assets/fonts/Rubik-Regular.ttf";
import rubikBold from "../../assets/fonts/Rubik-Bold.ttf";

interface SignedAgreementPdfInput {
  templatePdfBytes: Buffer;
  signaturePngBytes: Buffer;
  answers: IAgreementAnswer[];
  questions: IFormQuestion[];
  signedAt: Date;
  userDisplayName?: string;
}

export async function createSignedAgreementPdf(input: SignedAgreementPdfInput): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(input.templatePdfBytes);
  const fontBytes = new Uint8Array(fs.readFileSync(rubikRegular));
  const boldFontBytes = new Uint8Array(fs.readFileSync(rubikBold));

  const font = await pdfDoc.embedFont(fontBytes);
  const boldFont = await pdfDoc.embedFont(boldFontBytes);

  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  const { width, height } = lastPage.getSize();

  const signatureImage = await pdfDoc.embedPng(input.signaturePngBytes);
  const signatureDims = signatureImage.scale(1);
  const maxSigWidth = 240;
  const maxSigHeight = 100;
  const sigScale = Math.min(
    maxSigWidth / signatureDims.width,
    maxSigHeight / signatureDims.height,
    1
  );
  const sigWidth = signatureDims.width * sigScale;
  const sigHeight = signatureDims.height * sigScale;

  const margin = 48;
  const sigX = width - margin - sigWidth;
  const sigY = margin;

  lastPage.drawImage(signatureImage, {
    x: sigX,
    y: sigY,
    width: sigWidth,
    height: sigHeight,
  });

  const signedAtText = `Signed at: ${input.signedAt.toISOString()}`;
  lastPage.drawText(signedAtText, {
    x: margin,
    y: sigY + sigHeight + 10,
    size: 10,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  if (input.userDisplayName) {
    lastPage.drawText(`Signed by: ${input.userDisplayName}`, {
      x: margin,
      y: sigY + sigHeight + 24,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  }

  let page = pdfDoc.addPage();
  let y = page.getSize().height - margin;
  const maxWidth = page.getSize().width - margin * 2;
  const titleSize = 18;
  const bodySize = 11;

  page.drawText("Answers", {
    x: margin,
    y,
    size: titleSize,
    font: boldFont,
  });
  y -= titleSize + 12;

  const answerMap = new Map<string, IAgreementAnswer["value"]>();
  for (const answer of input.answers) {
    answerMap.set(answer.questionId, answer.value);
  }

  const questions =
    input.questions.length > 0
      ? input.questions.map((question) => ({ questionId: question._id, label: question.question }))
      : input.answers.map((answer) => ({
          questionId: answer.questionId,
          label: answer.questionId,
        }));

  for (const question of questions) {
    const answerValue = answerMap.get(question.questionId || "");
    const answerText = formatAnswerValue(answerValue);

    const questionLabel = question.label || question.questionId || "";
    const questionResult = drawWrappedText(
      pdfDoc,
      page,
      questionLabel,
      margin,
      y,
      maxWidth,
      boldFont,
      bodySize,
      margin
    );
    page = questionResult.page;
    y = questionResult.y - 2;

    const answerResult = drawWrappedText(
      pdfDoc,
      page,
      answerText,
      margin,
      y,
      maxWidth,
      font,
      bodySize,
      margin
    );
    page = answerResult.page;
    y = answerResult.y - bodySize;
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

function formatAnswerValue(value: IAgreementAnswer["value"] | undefined): string {
  if (value === null || value === undefined) return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Not provided";
  if (typeof value === "number") return value.toString();
  if (typeof value === "string" && value.trim().length === 0) return "Not provided";
  return String(value);
}

function drawWrappedText(
  pdfDoc: PDFDocument,
  page: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font: any,
  size: number,
  margin: number
): { page: any; y: number } {
  const lines = wrapText(text, font, size, maxWidth);
  const lineHeight = size + 3;
  for (const line of lines) {
    if (y < margin + lineHeight) {
      page = pdfDoc.addPage();
      y = page.getSize().height - margin;
    }
    page.drawText(line, { x, y, size, font });
    y -= lineHeight;
  }
  return { page, y };
}

function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split("\n");

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter((word) => word.length > 0);
    let line = "";
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, size);
      if (width <= maxWidth) {
        line = testLine;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }

  return lines.length ? lines : [""];
}
