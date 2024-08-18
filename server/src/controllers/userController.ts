import { UserService } from "../services/userService";
import { Request, Response } from "express";
import { UserSchemaValidation } from "../models/userModel";
import { StatusCode } from "../enums/StatusCode";

export class UserController {
  static async addUser(req: Request, res: Response) {
    try {

      const user = await UserService.createUser(req.body);

      res.status(StatusCode.CREATED).send(user);
    } catch (err: any) {
      res.status(StatusCode.BAD_REQUEST).send({message:err});
    }
  }

  static async getUsers(req: Request, res: Response) {
    try {
      const users = await UserService.getUsers();
      res.status(StatusCode.OK).send(users);
    } catch (err: any) {
      res.status(StatusCode.NOT_FOUND).send({message:err});
    }
  }

  static async getUser(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const user = await UserService.getUser(id);

      if (!user) {
        return res.status(StatusCode.NOT_FOUND).send("User not found");
      }

      res.status(StatusCode.OK).send(user);
    } catch (err: any) {
      res.status(StatusCode.NOT_FOUND).send({message:err});
    }
  }

  static async getUserByEmail(req: Request, res: Response) {
    try {
      const email = req.params.email;
      const user = await UserService.getUserByEmail(email);

      if (!user) {
        return res.status(StatusCode.NOT_FOUND).send("User not found");
      }

      res.status(StatusCode.OK).send(user);
    } catch (err: any) {
      res.status(StatusCode.NOT_FOUND).send({message:err});
    }
  }

  static async updateUser(req: Request, res: Response) {
    try {
      const id = req.params.id;

      const user = await UserService.updateUser(req.body, id);

      if (!user) {
        return res.status(StatusCode.NOT_FOUND).send("User not found");
      }

      res.status(StatusCode.OK).send(user);
    } catch (err: any) {
      res.status(StatusCode.BAD_REQUEST).send({message:err});
    }
  }

  static async updateManyUsers(req: Request, res: Response) {
    try {
      const users = await UserService.updateManyUsers(req.body);

      res.status(StatusCode.OK).send(users);
    } catch (err: any) {
      res.status(StatusCode.BAD_REQUEST).send({message:err});
    }
  }

  static async deleteUser(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const user = await UserService.deleteUser(id);

      if (!user) {
        return res.status(StatusCode.NOT_FOUND).send("User not found");
      }

      res.status(StatusCode.OK).send(user);
    } catch (err: any) {
      res.status(StatusCode.NOT_FOUND).send({message:err});
    }
  }
}

