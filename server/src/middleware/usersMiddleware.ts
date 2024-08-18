import { Request, Response, NextFunction } from "express";
import { UserSchemaValidation } from "../models/userModel";
import { StatusCode } from "../enums/StatusCode";

export const validateUser=(req:Request,res:Response,next:NextFunction)=>{
    
      const { error} = UserSchemaValidation.validate(req.body);

      if (error) {
        return res.status(StatusCode.BAD_REQUEST).send(error.message);
      }

      next()
}