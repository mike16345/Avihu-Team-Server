import express from "express";
import checkInRouter from "./checkInRoutes";
import { scheduleUserChecks } from "../../middleware/analyticsMiddleware";

const router = express.Router();

router.use(`/checkIns`, scheduleUserChecks, checkInRouter);

export default router;
