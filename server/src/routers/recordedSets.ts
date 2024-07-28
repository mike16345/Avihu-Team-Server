import { Router } from "express";
import { RecordedSetsController } from "../controllers/recordedSetsController";
import { validateRecordedSet } from "../middleware/recordedSetMiddleware";

const router = Router();

router.post("/", validateRecordedSet, RecordedSetsController.addRecordedSet);

router.get("/user/:id", RecordedSetsController.getRecordedSetsByUserId);

router.get("/user/:id/names", RecordedSetsController.getUserRecordedExerciseNamesByMuscleGroup);

export default router;
