type S3ObjectKeyParts = {
  folderName?: string;
  clientId?: string;
  date?: string;
  fileName?: string;
};

const requireNormalizedPart = (name: keyof S3ObjectKeyParts, value?: string) => {
  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value.normalize("NFC");
};

export const buildS3ObjectKey = ({
  folderName = "images",
  clientId,
  date,
  fileName,
}: S3ObjectKeyParts) => {
  return [
    requireNormalizedPart("folderName", folderName),
    requireNormalizedPart("clientId", clientId),
    requireNormalizedPart("date", date),
    requireNormalizedPart("fileName", fileName),
  ].join("/");
};
