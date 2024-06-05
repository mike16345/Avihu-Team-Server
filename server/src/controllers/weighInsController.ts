import { Request, Response } from "express";
import { WeighInSchemaValidation } from "../models/weighInModel";
import { weighInServices } from "../services/weighInService";
import { ObjectId } from "mongodb";

class WeighInsController {
  addWeighIn = async (req: Request, res: Response) => {
    const id = req.params.id;
    const data = {
      userId: id,
      weight: req.body.weight,
    };

    const { error, value } = WeighInSchemaValidation.validate(data);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    try {
      const weighIn = await weighInServices.addWeighIn(value);

      res.status(201).json(weighIn);
    } catch (err) {
      res.status(500).json({ message: "An error occurred while adding the weigh-in." });
    }
  };

  updateWeighIn = async (req: Request, res: Response) => {
    const id = req.params.id;
    const { weight } = req.body;

    console.log("id", id);
    console.log("weight", weight);

    try {
      const updatedWeighIn = await weighInServices.updateWeighIn(id, weight);
      console.log("updated ", updatedWeighIn);
      return res.status(201).json(updatedWeighIn);
    } catch (err) {
      return res.status(500).json({ message: err });
    }
  };

  deleteWeighIns = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const response = await weighInServices.deleteWeighIns(id);

      return res.status(201).json(response);
    } catch (err) {
      return res.status(500).json({ message: "There was an error deleting weigh ins." });
    }
  };

  getWeighInsByUserId = async (req: Request, res: Response) => {
    const { id } = req.query;

    try {
      const weighIns = await weighInServices.getWeightInsByUserId(id as string);

      return res.status(201).json(weighIns);
    } catch (err) {
      return res.status(500).json({ message: "An error occurred while requesting the weigh-ins." });
    }
  };
}

export const weighInsController = new WeighInsController();
