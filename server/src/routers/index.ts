import express from "express";
import userRouter from "./users";
import weighInsRouter from "./weighIns";
import workoutPlanRouter from "./workoutPlans";

const router = express.Router();

router.use("/users", userRouter);
router.use("/weighIns", weighInsRouter);
router.use("/workoutPlans", workoutPlanRouter);


export default router;
