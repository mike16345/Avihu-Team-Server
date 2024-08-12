import { NextFunction, Request, Response } from "express";
import { WeighInSchemaValidation } from "../models/weighInModel";
import { StatusCode } from "../enums/StatusCode";

export const validateWeighIn = (req: Request, res: Response, next: NextFunction) => {
  const { error } = WeighInSchemaValidation.validate(req.body);

  if (error) {
    return res.status(StatusCode.BAD_REQUEST).send({ message: error.message });
  }

  next();
};
