import express from "express";
import { MuscleGroupController } from "../controllers/muscleGroupController";
import { checkIfItemExixts } from "../middleware/muscleGroupMiddleWare";


const router = express.Router();

router.get(`/`, MuscleGroupController.getAllMuscleGroups)
router.post(`/`, checkIfItemExixts, MuscleGroupController.addMuscleGroup)
router.put(`/:id`, MuscleGroupController.editMuscleGroup)
router.delete(`/:id`, MuscleGroupController.deleteMuscleGroup)

export default router