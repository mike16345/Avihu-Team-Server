import { UserService } from "../services/userService";
import { Request, Response } from "express";
import { UserSchemaValidation } from "../models/userModel";

export class UserController {
  static async addUser(req: Request, res: Response) {
    try {


      const { error, value } = UserSchemaValidation.validate(req.body);

      if (error) {
        return res.status(400).send(error.message);
      }

      const user = await UserService.createUser(value);
      res.status(201).send(user);
    } catch (err: any) {
      res.status(500).send({message:err});
    }
  }

  static async getUsers(req: Request, res: Response) {
    try {
      const users = await UserService.getUsers();
      res.status(200).send(users);
    } catch (err: any) {
      res.status(500).send({message:err});
    }
  }

  static async getUser(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const user = await UserService.getUser(id);

      if (!user) {
        return res.status(404).send("User not found");
      }

      res.status(200).send(user);
    } catch (err: any) {
      res.status(500).send({message:err});
    }
  }

  static async getUserByEmail(req: Request, res: Response) {
    try {
      const email = req.params.email;
      const user = await UserService.getUserByEmail(email);

      if (!user) {
        return res.status(404).send("User not found");
      }

      res.status(200).send(user);
    } catch (err: any) {
      res.status(500).send({message:err});
    }
  }

  static async updateUser(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const data = req.body;

      const { error, value } = UserSchemaValidation.validate(data);

      if (error) {
        return res.status(400).send(error.message);
      }

      const user = await UserService.updateUser(value, id);

      if (!user) {
        return res.status(404).send("User not found");
      }

      res.status(200).send(user);
    } catch (err: any) {
      res.status(500).send({message:err});
    }
  }

  static async updateManyUsers(req: Request, res: Response) {
    try {
      const { error, value } = UserSchemaValidation.validate(req.body);

      if (error) {
        return res.status(400).send(error.message);
      }

      const users = await UserService.updateManyUsers(value);
      res.status(200).send(users);
    } catch (err: any) {
      res.status(500).send({message:err});
    }
  }

  static async deleteUser(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const user = await UserService.deleteUser(id);

      if (!user) {
        return res.status(404).send("User not found");
      }

      res.status(200).send(user);
    } catch (err: any) {
      res.status(500).send({message:err});
    }
  }
}

