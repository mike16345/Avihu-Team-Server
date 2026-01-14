import { S3 } from "aws-sdk";
import { streamToBuffer } from "./utils";

const s3 = new S3({
  apiVersion: "2006-03-01",
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_KEY,
  region: process.env.AMAZON_REGION,
  signatureVersion: "v4",
});

function getBucketName(): string {
  const bucket = process.env.AWS_BUCKET;
  if (!bucket) {
    throw new Error("AWS_BUCKET is not configured.");
  }
  return bucket;
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  const result = await s3
    .getObject({
      Bucket: getBucketName(),
      Key: key,
    })
    .promise();

  if (!result.Body) {
    throw new Error(`S3 object ${key} is empty.`);
  }

  if (Buffer.isBuffer(result.Body)) return result.Body;
  if (typeof result.Body === "string") return Buffer.from(result.Body);
  if (result.Body instanceof Uint8Array) return Buffer.from(result.Body);

  return streamToBuffer(result.Body as NodeJS.ReadableStream);
}

export async function putObjectBuffer(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  await s3
    .putObject({
      Bucket: getBucketName(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
    .promise();
}

export async function getPresignedGetUrl(key: string, expiresSeconds: number): Promise<string> {
  return s3.getSignedUrlPromise("getObject", {
    Bucket: getBucketName(),
    Key: key,
    Expires: expiresSeconds,
  });
}

export async function getPresignedPutUrl(
  key: string,
  contentType: string,
  expiresSeconds: number
): Promise<string> {
  return s3.getSignedUrlPromise("putObject", {
    Bucket: getBucketName(),
    Key: key,
    Expires: expiresSeconds,
    ContentType: contentType,
  });
}
