import { Router } from "express";
import workoutPlansRouter from "./workoutPlans";
import recordedSetsRouter from "./recordedSets";

const router = Router();

router.use("/workoutPlans", workoutPlansRouter);
router.use("/recordedSets", recordedSetsRouter);

export default router;
