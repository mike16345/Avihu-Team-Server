import mongoose from "mongoose";
import { gridFSBucket } from "../db/mainConnection";

interface IPhotoMetadata {
  id: string;
  filename: string;
  contentType: string;
  data?: string; // Base64 encoded image data
}

// Upload a photo with metadata (userId)
export const uploadWeighInPhoto = (
  filename: string,
  fileBuffer: Buffer,
  userId: string
): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const uploadStream = gridFSBucket.openUploadStream(filename, {
      metadata: { userId }, // Store userId as metadata
    });
    uploadStream.end(fileBuffer); // Use end() with fileBuffer for memory storage

    uploadStream.on("finish", () => resolve(uploadStream.id.toString()));
    uploadStream.on("error", (err: any) => reject(err));
  });
};

// Download a photo from GridFS
export const downloadWeighInPhoto = (fileId: string, res: any): void => {
  const downloadStream = gridFSBucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));

  downloadStream.on("data", (chunk) => res.write(chunk));
  downloadStream.on("end", () => res.end());
  downloadStream.on("error", (err) => res.status(500).send(err));
};

export const getPhotosByUserId = async (userId: string): Promise<IPhotoMetadata[]> => {
  try {
    // Query to find files with the specified userId
    const query = { "metadata.userId": userId };
    const files = await gridFSBucket.find(query).toArray();

    // Map through files to fetch image data
    const photoPromises = files.map(async (file) => {
      const downloadStream = gridFSBucket.openDownloadStream(new mongoose.Types.ObjectId(file._id));
      const chunks: Buffer[] = [];

      // Collect image chunks
      return new Promise<IPhotoMetadata>((resolve, reject) => {
        downloadStream.on("data", (chunk) => chunks.push(chunk));
        downloadStream.on("end", () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            id: file._id.toString(),
            filename: file.filename,
            contentType: file.contentType,
            data: buffer.toString("base64"), // Encode as base64
          });
        });
        downloadStream.on("error", reject);
      });
    });

    // Wait for all photo promises to resolve
    return Promise.all(photoPromises);
  } catch (err) {
    throw new Error(`Failed to get photos by userId: ${err.message}`);
  }
};
