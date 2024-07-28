import { Request, Response } from "express";
import { exercisePresetValidationSchema } from "../models/exercisePresetModel";
import { exercisePresetServices } from "../services/exercisePresetService";

class ExercisePresetController {
  // Be consistent in general on how you return responses.
  // Sometimes you return the whole error, sometimes a custom string, sometimes only the error message.

  addExercise = async (req: Request, res: Response) => {
    // req.body is already this object { name: exercise }
    // So creating two new variables is unnecessary.
    const exercise = req.body.name;

    const exerciseObject = { name: exercise };

    //  Place this in middleware
    const { error, value } = exercisePresetValidationSchema.validate(exerciseObject);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    try {
      const excercisePreset = await exercisePresetServices.addExercise(value);

      res.status(201).json(excercisePreset);
    } catch (error) {
      res.status(500).json(error.message);
    }
  };
  getExercises = async (req: Request, res: Response) => {
    try {
      const allExercises = await exercisePresetServices.getExercises();

      res.status(201).json(allExercises);
    } catch (error) {
      res.status(500).json({ message: `An error occured while locating the exercise presets` });
    }
  };
  getExerciseById = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const exercise = await exercisePresetServices.getExerciseById(id);

      res.status(201).json(exercise);
    } catch (error) {
      res.status(500).json({ message: `An error occured while locating the exercise presets` });
    }
  };

  deleteExercise = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const exercise = await exercisePresetServices.deleteExercise(id);

      res.status(201).json(exercise);
    } catch (error) {
      res.status(500).json({ message: `An error occured while locating the exercise presets` });
    }
  };
  updateExercise = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;

    try {
      const exercise = await exercisePresetServices.updateExercise(id, name);

      res.status(201).json(exercise);
    } catch (error) {
      res.status(500).json({ message: `An error occured while locating the exercise presets` });
    }
  };
}

export const exercisePresetController = new ExercisePresetController();
