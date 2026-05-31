import mongoose from "mongoose";
import {
  AgreementTemplateActivationSchema,
  AgreementTemplateModel,
  AgreementTemplateUploadSchema,
} from "../../src/models/agreementTemplateModel";

describe("AgreementTemplate model", () => {
  test("should save a valid agreement template without title", async () => {
    const template = new AgreementTemplateModel({
      agreementId: new mongoose.Types.ObjectId().toString(),
      version: 1,
      active: true,
      templatePdfS3Key: "agreements/templates/test/1.pdf",
      questions: [],
      trainerId: new mongoose.Types.ObjectId(),
    });

    const savedTemplate = await template.save();

    expect(savedTemplate.title).toBeUndefined();
    expect(savedTemplate.agreementId).toBe(template.agreementId);
  });

  test("should save a valid agreement template with title", async () => {
    const template = new AgreementTemplateModel({
      title: "PAR-Q Agreement",
      agreementId: new mongoose.Types.ObjectId().toString(),
      version: 1,
      active: true,
      templatePdfS3Key: "agreements/templates/test/1.pdf",
      questions: [],
      trainerId: new mongoose.Types.ObjectId(),
    });

    const savedTemplate = await template.save();

    expect(savedTemplate.title).toBe("PAR-Q Agreement");
  });
});

describe("AgreementTemplate Joi validation", () => {
  test("should validate upload payload without title", () => {
    const { error } = AgreementTemplateUploadSchema.validate({
      contentType: "application/pdf",
    });

    expect(error).toBeUndefined();
  });

  test("should validate upload payload with title", () => {
    const { error, value } = AgreementTemplateUploadSchema.validate({
      title: "PAR-Q Agreement",
      contentType: "application/pdf",
    });

    expect(error).toBeUndefined();
    expect(value.title).toBe("PAR-Q Agreement");
  });

  test("should keep activation payload unchanged", () => {
    const { error } = AgreementTemplateActivationSchema.validate({
      version: 1,
      questions: [],
    });

    expect(error).toBeUndefined();
  });
});
