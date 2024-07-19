import express from "express";
import userRouter from "./users";
import weighInsRouter from "./weighIns";
import workoutPlanRouter from "./workoutPlans";
import workoutPlanPresetRouter from "./workoutPlanPresets";
import recordedSetsRouter from "./recordedSets";
import dietPlansRouter from "./dietPlans";

const router = express.Router();

router.use("/users", userRouter);
router.use("/weighIns", weighInsRouter);
router.use("/workoutPlans", workoutPlanRouter);
router.use("/workoutPlansPresets", workoutPlanPresetRouter);
router.use("/recordedSets", recordedSetsRouter);
router.use("/dietPlans", dietPlansRouter);

export default router;
