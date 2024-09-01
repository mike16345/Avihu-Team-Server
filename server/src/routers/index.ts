import express from "express";
import weighInsRouter from "./weighIns/";
import dietPlanRouter from "./dietPlans";
import presetsRouter from "./presets/";
import sessionsRouter from "./sessions/";
import workoutRouter from "./workouts";
import analyticsRouter from "./analytics/MainAnalyticsRoutes";

// Main router for all API endpoints
const router = express.Router();

router.use("/analytics", analyticsRouter);
router.use("/weighIns", weighInsRouter);
router.use("/dietPlans", dietPlanRouter);
router.use("/presets", presetsRouter);
router.use("/sessions", sessionsRouter);
router.use("/", workoutRouter);

export default router;
