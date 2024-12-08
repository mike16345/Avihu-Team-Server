import { exercisePresets } from "../models/exercisePresetModel";
import { Cache } from "../utils/cache";

// Initialize the cache for exercise presets
let cachedExercises = new Cache<any>();

export class ExercisePresetService {
  static async addExercise(data: any) {
    try {
      const newExercise = await exercisePresets.create(data);
      // Invalidate cache for all exercises after adding a new one
      cachedExercises.invalidate("all");

      return newExercise;
    } catch (error) {
      throw error;
    }
  }

  static async getExercises() {
    // Check if exercises are cached
    const cached = cachedExercises.get("all");

    try {
      // If cached, return the cached data, otherwise fetch from DB
      const exercises = cached || (await exercisePresets.find());
      cachedExercises.set("all", exercises); // Cache the fetched exercises

      return exercises;
    } catch (error) {
      throw error;
    }
  }

  static async getExercisesByMuscleGroup(muscleGroup: string) {
    // Check if exercises for the muscle group are cached
    const cached = cachedExercises.get(muscleGroup);

    try {
      // If cached, return the cached data, otherwise fetch from DB
      const exercises = cached || (await exercisePresets.find({ muscleGroup }));
      cachedExercises.set(muscleGroup, exercises); // Cache the fetched exercises by muscle group

      return exercises;
    } catch (error) {
      throw error;
    }
  }

  static async getExerciseById(id: string) {
    // Check if the exercise by ID is cached
    const cached = cachedExercises.get(id);

    try {
      // If cached, return the cached data, otherwise fetch from DB
      const exercise = cached || (await exercisePresets.findById(id));
      cachedExercises.set(id, exercise); // Cache the fetched exercise by ID

      return exercise;
    } catch (error) {
      throw error;
    }
  }

  static async getExerciseByName(name: string) {
    // Check if the exercise by name is cached
    const cached = cachedExercises.get(name);

    try {
      // If cached, return the cached data, otherwise fetch from DB
      const exercise = cached || (await exercisePresets.findOne({ name }));
      cachedExercises.set(name, exercise); // Cache the fetched exercise by name

      return exercise;
    } catch (error) {
      throw error;
    }
  }

  static async deleteExercise(id: string) {
    try {
      const deletedExercise = await exercisePresets.deleteOne({ _id: id });
      // Invalidate all cache since the data has changed
      cachedExercises.invalidateAll();

      return deletedExercise;
    } catch (error) {
      throw error;
    }
  }

  static async updateExercise(id: string, newExercise: any) {
    try {
      const updatedExercise = await exercisePresets.findOneAndUpdate({ _id: id }, newExercise, {
        new: true,
      });
      // Invalidate all cache since the data has changed
      cachedExercises.invalidateAll();

      return updatedExercise;
    } catch (error) {
      throw error;
    }
  }
}
