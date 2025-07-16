import { AVG_CARB_CALORIES, AVG_FAT_CALORIES, AVG_PROTEIN_CALORIES } from "../constants/Constants";
import { IMeal } from "../interfaces/IDietPlan";

export const calculateTotalCalories = (meals: IMeal[], totalFats = 0) => {
  const totalProteins = meals.reduce((acc, m: IMeal) => acc + (m.totalProtein.quantity || 0), 0);
  const totalCarbs = meals.reduce((acc, m: IMeal) => acc + (m.totalCarbs.quantity || 0), 0);

  const proteinCalories = totalProteins * AVG_PROTEIN_CALORIES;
  const carbCalories = totalCarbs * AVG_CARB_CALORIES;
  const fatCalories = totalFats * AVG_FAT_CALORIES;

  return proteinCalories + carbCalories + fatCalories;
};
