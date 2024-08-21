import express from "express";
import checkInRouter from "./checkInRoutes";

const router = express.Router();

router.use(`/checkIns`, checkInRouter);

export default router;
