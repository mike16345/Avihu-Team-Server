import { Request, Response } from "express";
import { DietPlanPresetsService } from "../services/dietPlanPresetsService";
import { StatusCode } from "../enums/StatusCode";
import { removeNestedIds } from "../utils/utils";

export class DietPlanPresetController {
  static addDietPlanPreset = async (req: Request, res: Response) => {
    const dietPlanPreset = req.body;

    try {
      const dietPlanPresetResult = await DietPlanPresetsService.addDietPlanPreset(dietPlanPreset);

      return res.status(StatusCode.CREATED).send(dietPlanPresetResult);
    } catch (err: any) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  };

  static updateDietPlanPreset = async (req: Request, res: Response) => {
    const dietPlanPresetId = req.params.id;
    const newDietPlanPreset = removeNestedIds(req.body);

    try {
      const updatedDietPlanPreset = await DietPlanPresetsService.updateDietPlanPreset(
        dietPlanPresetId,
        newDietPlanPreset
      );

      return res.status(StatusCode.OK).send(updatedDietPlanPreset);
    } catch (err: any) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  };

  static deleteDietPlanPreset = async (req: Request, res: Response) => {
    const id = req.params.id;

    try {
      const response = await DietPlanPresetsService.deleteDietPlanPreset(id);

      if (typeof response == "string") {
        res.status(StatusCode.NOT_FOUND).send({ message: response });
      }

      return res.status(StatusCode.OK).send(response);
    } catch (err: any) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  };

  static getDietPlanPresets = async (req: Request, res: Response) => {
    try {
      const dietPlanPresets = await DietPlanPresetsService.getAllDietPlanPresets();

      res.status(StatusCode.OK).send(dietPlanPresets);
    } catch (err: any) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  };

  static getDietPlanPresetById = async (req: Request, res: Response) => {
    const dietPlanPresetId = req.params.id;

    if (!dietPlanPresetId || typeof dietPlanPresetId !== "string") {
      return res
        .status(StatusCode.BAD_REQUEST)
        .send({ message: "Diet Plan ID is required and should be a string." });
    }

    try {
      const dietPlanPreset = await DietPlanPresetsService.getDietPlanPresetById(dietPlanPresetId);

      return res.status(StatusCode.OK).send(dietPlanPreset);
    } catch (err: any) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  };
}
