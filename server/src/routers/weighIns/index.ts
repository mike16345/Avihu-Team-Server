import { Router } from "express";
import weighInsRouter from "./weighIns";
import weighInPhotosRouter from "./weighInPhotos";

const router = Router();

router.use("/weights", weighInsRouter);
router.use("/photos", weighInPhotosRouter);

export default router;
