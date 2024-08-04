import express from "express";
import userRouter from "./users";
import weighInsRouter from "./weighIns/";
import workoutPlanRouter from "./workoutPlans";
import recordedSetsRouter from "./recordedSets";
import dietPlanRouter from "./dietPlans";
import presetsRouter from "./presets/";

const router = express.Router();

router.use("/users", userRouter);
router.use("/weighIns", weighInsRouter);
router.use("/workoutPlans", workoutPlanRouter);
router.use("/dietPlans", dietPlanRouter);
router.use("/recordedSets", recordedSetsRouter);
router.use("/presets", presetsRouter);

export default router;
