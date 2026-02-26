import crypto from "crypto";

export const sha256 = (buffer: Buffer): string => {
  return crypto.createHash("sha256").update(buffer).digest("hex");
};
