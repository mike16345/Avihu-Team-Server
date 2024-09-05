import express from "express";
import weighInsRouter from "./weighIns/";
import presetsRouter from "./presets/";
import analyticsRouter from "./analytics/MainAnalyticsRoutes";

// Main router for all API endpoints
const router = express.Router();

router.use("/analytics", analyticsRouter);
router.use("/weighIns", weighInsRouter);
router.use("/presets", presetsRouter);

export default router;
