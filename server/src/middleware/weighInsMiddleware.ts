import sharp from "sharp";
import { Request, Response, NextFunction } from "express";
import { WeighInSchemaValidation } from "../models/weighInModel";
import { StatusCode } from "../enums/StatusCode";

export const compressPhoto = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next();
  }

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

export const validateWeighIn = (req: Request, res: Response, next: NextFunction) => {
  const { error } = WeighInSchemaValidation.validate(req.body);

  if (error) {
    return res.status(StatusCode.BAD_REQUEST).send({ message: error.message });
  }

  next();
};
