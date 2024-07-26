import { Request, Response } from "express";
import { workoutPlanService } from "../services/workoutPlanService";

class WorkoutPlanController {
  addWorkoutPlan = async (req: Request, res: Response) => {
    const id = req.params.userId;
    const data = req.body;

    try {
      const workoutPlan = await workoutPlanService.addWorkoutPlan({ ...data, userId: id });

      res.status(201).json(workoutPlan);
    } catch (err) {
      res.status(500).json({ message: "An error occurred while adding the workout plan." });
    }
  };

  updateWorkoutPlan = async (req: Request, res: Response) => {
    const id = req.params.id;
    const updatedData = req.body;

    try {
      const updatedWorkoutPlan = await workoutPlanService.updateWorkoutPlan(id, updatedData);

      res.status(200).json(updatedWorkoutPlan);
    } catch (err) {
      res.status(500).json({ message: "An error occurred while updating the workout plan." });
    }
  };

  updateWorkoutPlanByUserId = async (req: Request, res: Response) => {
    const id = req.params.userId;
    const updatedData = req.body;

    try {
      const updatedWorkoutPlan = await workoutPlanService.updateWorkoutPlanByUserId(
        id,
        updatedData
      );

      if (!updatedWorkoutPlan) {
        return res.status(404).json({ message: "There was an error updating the workout plan." });
      }

      res.status(200).json(updatedWorkoutPlan);
    } catch (err) {
      res.status(500).json({ message: "An error occurred while updating the workout plan." });
    }
  };

  deleteWorkoutPlan = async (req: Request, res: Response) => {
    const id = req.params.id;

    try {
      const deletedWorkoutPlan = await workoutPlanService.deleteWorkoutPlanById(id);

      res.status(200).json(deletedWorkoutPlan);
    } catch (err) {
      res.status(500).json({ message: "An error occurred while deleting the workout plan." });
    }
  };

  getAllWorkoutPlans = async (req: Request, res: Response) => {
    try {
      const workoutPlans = await workoutPlanService.getAllWorkoutPlans();

      res.status(200).json(workoutPlans);
    } catch (err) {
      res.status(500).json({ message: "An error occurred while retrieving all workout plans." });
    }
  };

  getWorkoutPlanById = async (req: Request, res: Response) => {
    const id = req.params.id;

    try {
      const workoutPlan = await workoutPlanService.getWorkoutPlanById(id);

      if (!workoutPlan) {
        return res.status(404).json({ message: "Workout plan not found." });
      }

      res.status(200).json(workoutPlan);
    } catch (err) {
      res.status(500).json({ message: "An error occurred while retrieving the workout plan." });
    }
  };

  getWorkoutPlanByUserId = async (req: Request, res: Response) => {
    const id = req.params.id;

    try {
      const workoutPlan = await workoutPlanService.getWorkoutPlanById(id);

      if (!workoutPlan) {
        return res.status(404).json({ message: "Workout plan not found." });
      }

      res.status(200).json(workoutPlan);
    } catch (err) {
      res.status(500).json({ message: "An error occurred while retrieving the workout plan." });
    }
  };
}

export const workoutPlanController = new WorkoutPlanController();
