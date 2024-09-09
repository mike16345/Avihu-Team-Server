import express from "express";
import checkInRouter from "./checkInRoutes";
import analyticsRouter from "./analyticsRoutes";
import { scheduleUserChecks } from "../../middleware/analyticsMiddleware";

const router = express.Router();

router.use(`/checkIns`, scheduleUserChecks, checkInRouter);
router.use(`/`, analyticsRouter);

export default router;
