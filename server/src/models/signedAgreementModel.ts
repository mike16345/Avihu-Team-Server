import { Schema, model } from "mongoose";
import { IAgreementAnswer, ISignedAgreement } from "../interfaces/IAgreement";

const answerSchema = new Schema<IAgreementAnswer>({
  questionId: { type: String, required: true },
  value: { type: Schema.Types.Mixed, required: true },
});

const signedAgreementSchema = new Schema<ISignedAgreement>({
  groupId: { type: String, required: false },
  userId: { type: String, required: true },
  agreementId: { type: String, required: true },
  agreementVersion: { type: Number, required: true },
  answers: { type: [answerSchema], default: [] },
  signedAt: { type: Date, default: Date.now },
  templatePdfS3Key: { type: String, required: true },
  signedPdfS3Key: { type: String, required: true },
  signatureS3Key: { type: String, required: false },
  signatureSha256: { type: String, required: false },
  signedPdfSha256: { type: String, required: true },
});

signedAgreementSchema.index({ userId: 1, agreementId: 1, signedAt: -1 });
signedAgreementSchema.index({ agreementId: 1, agreementVersion: 1 });

export const SignedAgreementModel = model("signedAgreements", signedAgreementSchema);
