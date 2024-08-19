import { Request, Response } from "express";
import { StatusCode } from "../enums/StatusCode";
import { uploadWeighInPhoto, getPhotosByUserId } from "../services/weighInPhotosService";

export class WeighInPhotosController {
  static async uploadPhoto(req: Request, res: Response) {
    const file = req.file;
    const userId = req.params.userId; // Get userId from request body

    if (!file || !userId) {
      return res.status(StatusCode.BAD_REQUEST).send("File or userId not provided.");
    }

    try {
      const fileId = await uploadWeighInPhoto(file.originalname, file.buffer, userId);

      res.status(StatusCode.CREATED).send({ fileId });
    } catch (err: any) {
      console.error(err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  }

  static async getPhotos(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId;

    try {
      const photos = await getPhotosByUserId(userId);

      // Return an array of metadata or URLs
      res.status(200).json(photos);
    } catch (err) {
      console.error(err);
      res.status(500).send(err);
    }
  }
}
