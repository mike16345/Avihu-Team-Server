import { Router } from "express";
import { RecordedSetsController } from "../controllers/recordedSetsController";
import { validateRecordedSet } from "../middleware/recordedSetMiddleware";

const router = Router();

router.post("/", validateRecordedSet, RecordedSetsController.addRecordedSet);

router.get("/user/:id", RecordedSetsController.getRecordedSetsByUserId);

router.get(
  "/user/:userId/muscleGroup/:muscleGroup",
  RecordedSetsController.getRecordedSetsByUserAndMuscleGroup
);

export default router;
