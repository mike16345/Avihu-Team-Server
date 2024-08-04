import express from "express";
import { MuscleGroupController } from "../../controllers/muscleGroupController";
import { checkIfMuscleGroupExists } from "../../middleware/muscleGroupMiddleWare";

const router = express.Router();

router.get(`/`, MuscleGroupController.getAllMuscleGroups);

router.get(`/:id`, MuscleGroupController.getMuscleGroupById);

router.post(`/`, checkIfMuscleGroupExists, MuscleGroupController.addMuscleGroup);

router.put(`/:id`, MuscleGroupController.editMuscleGroup);

router.delete(`/:id`, MuscleGroupController.deleteMuscleGroup);

export default router;
