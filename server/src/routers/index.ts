import express from "express";
import weighInsRouter from "./weighIns/";
import analyticsRouter from "./analytics/MainAnalyticsRoutes";

// Main router for all API endpoints
const router = express.Router();

router.use("/analytics", analyticsRouter);
router.use("/weighIns", weighInsRouter);

export default router;
