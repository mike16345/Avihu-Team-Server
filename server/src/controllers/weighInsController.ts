import { Request, Response } from "express";
import { WeighInSchemaValidation } from "../models/weighInModel";
import { weighInServices } from "../services/weighInService";
import { IWeighIn } from "../interfaces/IWeighIns";
import { UpdateResult } from "mongodb";

class WeighInsController {
  addWeighIn = async (req: Request, res: Response) => {
    const id = req.params.id;
    const weighInToAdd = req.body;

    const { error, value } = WeighInSchemaValidation.validate(weighInToAdd);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    try {
      const weighIn = await weighInServices.addWeighIn(weighInToAdd, id);

      res.status(201).json(weighIn);
    } catch (err) {
      res.status(500).json({ message: "An error occurred while adding the weigh-in." });
    }
  };

  addManyWeighIns = async (req: Request, res: Response) => {
    const id = req.params.id;
    const weighIns = req.body.weighIns as IWeighIn[];

    try {
      const result = await weighInServices.addManyWeighIns(weighIns, id);

      res.status(201).send(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  };

  updateWeighIn = async (req: Request, res: Response) => {
    const id = req.params.id;
    const { weight } = req.body;

    console.log("id", id);
    console.log("weight", weight);

    try {
      const updatedWeighIn = (await weighInServices.updateWeighIn(id, weight)) as UpdateResult;

      if (updatedWeighIn.matchedCount == 0) {
        res.status(404).send({ message: "Weigh in not found!" });
      }

      res.status(201).json(updatedWeighIn);
    } catch (err) {
      res.status(500).send({ message: err });
    }
  };

  deleteUserWeighIns = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const response = await weighInServices.deleteUserWeighIns(id);

      return res.status(201).json(response);
    } catch (err) {
      return res.status(500).json({ message: "There was an error deleting weigh ins." });
    }
  };

  deleteWeighInById = async (req: Request, res: Response) => {
    const { weighInId } = req.params;

    try {
      const response = await weighInServices.deleteWeighInById(weighInId);

      res.status(200).send(response);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  };

  getWeighInsByUserId = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const weighIns = await weighInServices.getWeighInsByUserId(id as string);

      if (!weighIns) {
        return res.status(404).json({ message: "No weigh ins found for this user." });
      }

      return res.status(201).json(weighIns);
    } catch (err) {
      return res.status(500).json({ message: "An error occurred while requesting the weigh-ins." });
    }
  };

  getWeighInsById = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const weighIns = await weighInServices.getWeighInsById(id);

      return res.status(201).json(weighIns);
    } catch (err) {
      return res.status(500).json({ message: "An error occurred while requesting the weigh-ins." });
    }
  };
}

export const weighInsController = new WeighInsController();
