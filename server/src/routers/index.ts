import express from "express";
import userRouter from "./users";
import weighInsRouter from "./weighIns/";
import workoutPlanRouter from "./workouts/workoutPlans";
import dietPlanRouter from "./dietPlans";
import recordSetsRouter from "./workouts/recordedSets";
import presetsRouter from "./presets/";
import sessionsRouter from "./sessions/";

// Main router for all API endpoints
const router = express.Router();

router.use("/users", userRouter);
router.use("/weighIns", weighInsRouter);
router.use("/workoutPlans", workoutPlanRouter);
router.use("/dietPlans", dietPlanRouter);
router.use("/recordedSets", recordSetsRouter);
router.use("/presets", presetsRouter);
router.use("/sessions", sessionsRouter);

export default router;
