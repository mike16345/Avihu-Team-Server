import { Router } from "express";
import weighInPhotosRouter from "./weighInPhotos";

const router = Router();

router.use("/photos", weighInPhotosRouter);

export default router;
