import sharp from "sharp";
import { Request, Response, NextFunction } from "express";

// Middleware to compress photo
const compressPhoto = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next();
  }

  // Compress the image
  sharp(req.file.buffer)
    .resize({ width: 800, height: 800 }) // Resize to width of 800px while maintaining aspect ratio
    .jpeg({ quality: 50 }) // Adjust the quality (0-100), lower means more compression
    .toBuffer()
    .then((data) => {
      req.file!.buffer = data;
      req.file!.mimetype = "image/jpeg"; // Set mimetype to the appropriate format
      next();
    })
    .catch((err) => {
      res.status(500).json({ error: "Image compression failed" });
    });
};

export default compressPhoto;
