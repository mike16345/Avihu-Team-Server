import { PDFDocument, PDFFont, PDFPage, rgb } from "pdf-lib";
import { IAgreementAnswer } from "../interfaces/IAgreement";
import { IFormQuestion, QuestionTypes } from "../interfaces/IForm";
import rubikRegular from "../../assets/fonts/Rubik-Regular";
import rubikBold from "../../assets/fonts/Rubik-Bold";
import * as fontkit from "fontkit";
import moment from "moment";

interface SignedAgreementPdfInput {
  templatePdfBytes: Buffer;
  signaturePngBytes: Buffer;
  answers: IAgreementAnswer[];
  questions: IFormQuestion[];
  signedAt: Date;
  userDisplayName?: string;
}
const NOT_ANSWERED_TEXT = "לא נענתה/נענה";

function getTextMargin(
  textToMeasure: string,
  fontSize: number,
  margin: number,
  font: PDFFont,
  page: PDFPage
) {
  const textWidth = font.widthOfTextAtSize(textToMeasure, fontSize);
  const { width } = page.getSize();

  return width - margin - textWidth;
}

export async function createSignedAgreementPdf(input: SignedAgreementPdfInput): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(input.templatePdfBytes);
  pdfDoc.registerFontkit(fontkit);

  const font = await pdfDoc.embedFont(rubikRegular);
  const boldFont = await pdfDoc.embedFont(rubikBold);

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

  const signatureTextSize = 10;
  const signedAtText = `נחתם ב: `;
  const signedAtDate = moment(input.signedAt).format("YYYY.MM.DD HH:mm");
  const signedAtTextMargin = getTextMargin(signedAtText, signatureTextSize, margin, font, lastPage);

  lastPage.drawText(signedAtText, {
    x: signedAtTextMargin,
    y: sigY + sigHeight + 10,
    size: 10,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  const labelWidth = font.widthOfTextAtSize(signedAtText, signatureTextSize);
  const dateMargin = margin + labelWidth;

  lastPage.drawText(signedAtDate, {
    x: getTextMargin(signedAtDate, signatureTextSize, dateMargin, font, lastPage),
    y: sigY + sigHeight + 10,
    size: 10,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  if (input.userDisplayName) {
    const displayNameText = `נחתם על ידי: ${input.userDisplayName}`;

    lastPage.drawText(displayNameText, {
      x: getTextMargin(displayNameText, signatureTextSize, margin, font, lastPage),
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
  const answersHeader = "תשובות:";

  page.drawText(answersHeader, {
    x: getTextMargin(answersHeader, titleSize, margin, font, page),
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
      ? input.questions.map((question) => ({
          questionId: question._id,
          label: question.question,
          type: question.type,
        }))
      : input.answers.map((answer) => ({
          questionId: answer.questionId,
          label: answer.questionId,
          type: undefined,
        }));

  for (const question of questions) {
    const answerValue = answerMap.get(question.questionId?.toString() || "");
    const answerText = formatAnswerValue(answerValue, question.type);

    const questionLabel = question.label || question.questionId || "";
    const questionResult = drawWrappedText(
      pdfDoc,
      page,
      questionLabel,
      margin,
      y,
      maxWidth,
      boldFont,
      bodySize
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
      bodySize
    );
    page = answerResult.page;
    y = answerResult.y - bodySize;
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

function formatAnswerValue(
  value: IAgreementAnswer["value"] | undefined,
  type?: QuestionTypes
): string {
  if (value === null || value === undefined) return NOT_ANSWERED_TEXT;
  if (typeof value === "boolean") return value ? "כן" : "לא";
  if (Array.isArray(value)) return value.length ? value.join(", ") : NOT_ANSWERED_TEXT;
  if (typeof value === "number") return value.toString();
  if (typeof value === "string" && value.trim().length === 0) return NOT_ANSWERED_TEXT;
  if (typeof value === "string" && type === "yes-no" && value !== "לא") return `כן, ${value}`;
  return String(value);
}

function drawWrappedText(
  pdfDoc: PDFDocument,
  page: any,
  text: string,
  margin: number,
  y: number,
  maxWidth: number,
  font: any,
  size: number
): { page: any; y: number } {
  const lines = wrapText(text, font, size, maxWidth);
  const lineHeight = size + 3;
  for (const line of lines) {
    if (y < margin + lineHeight) {
      page = pdfDoc.addPage();
      y = page.getSize().height - margin;
    }

    const x = getTextMargin(line, size, margin, font, page);
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
