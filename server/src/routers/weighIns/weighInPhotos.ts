import express from "express";
import multer from "multer";
import { WeighInPhotosController } from "../../controllers/weighInPhotosController";

const router = express.Router();
const upload = multer(); // Initialize Multer

router.post("/upload/:userId", upload.single("photo"), WeighInPhotosController.uploadPhoto);

router.get("/:userId", WeighInPhotosController.getPhotos);

export default router;
