import {
  AVG_CARB_CALORIES,
  AVG_FAT_CALORIES,
  AVG_VEGGIE_CALORIES,
  AVG_PROTEIN_CALORIES,
} from "../constants/Constants";
import { IMeal } from "../interfaces/IDietPlan";

export const calculateTotalCalories = (meals: IMeal[], freeCalories: number = 0) => {
  const totalProteins = meals.reduce(
    (acc, m: IMeal) => acc + (Number(m.totalProtein.quantity) || 0),
    0
  );
  const totalCarbs = meals.reduce((acc, m: IMeal) => acc + (Number(m.totalCarbs.quantity) || 0), 0);
  const totalFats = meals.reduce((acc, m: IMeal) => acc + (Number(m.totalFats?.quantity) || 0), 0);
  const totalVeggies = meals.reduce(
    (acc, m: IMeal) => acc + (Number(m.totalVeggies?.quantity) || 0),
    0
  );

  const proteinCalories = totalProteins * AVG_PROTEIN_CALORIES;
  const carbCalories = totalCarbs * AVG_CARB_CALORIES;
  const fatCalories = totalFats * AVG_FAT_CALORIES;
  const veggieCalories = totalVeggies * AVG_VEGGIE_CALORIES;

  const finalResult = proteinCalories + carbCalories + fatCalories + veggieCalories + freeCalories;
  console.log("[dietPlan.ts] Final totalCalories result: ", finalResult);

  return finalResult;
};
