import { userServices } from "../services/userService";
import { Request, Response } from "express";
import { UserSchemaValidation } from "../models/userModel";

class UserController {
  addUser = async (req: Request, res: Response) => {
    
    try {
      const data = {
        name: req.body.name,
        email: req.body.email,
      };

      const { error, value } = UserSchemaValidation.validate(data);

      if (error) {
        return res.status(400).send(error.message);
      }

      const user = await userServices.createUser(value);
      res.status(201).send(user);
    } catch (err: any) {
      res.status(500).send(err.message);
    }
  };

  getUsers = async (req: Request, res: Response) => {
    try {
      const users = await userServices.getUsers();
      res.status(200).send(users);
    } catch (err: any) {
      res.status(500).send(err.message);
    }
  };

  getUser = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const user = await userServices.getUser(id);

      if (!user) {
        return res.status(404).send("User not found");
      }

      res.status(200).send(user);
    } catch (err: any) {
      res.status(500).send(err.message);
    }
  };

  getUserByEmail = async (req: Request, res: Response) => {
    try {
      const email = req.params.email;
      const user = await userServices.getUserByEmail(email);

      if (!user) {
        return res.status(404).send("User not found");
      }

      res.status(200).send(user);
    } catch (err: any) {
      res.status(500).send(err.message);
    }
  };

  updateUser = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const data = req.body;
      data._id = id;

      const { error, value } = UserSchemaValidation.validate(data);

      if (error) {
        return res.status(400).send(error.message);
      }

      const user = await userServices.updateUser(value);

      if (!user) {
        return res.status(404).send("User not found");
      }

      res.status(200).send(user);
    } catch (err: any) {
      res.status(500).send(err.message);
    }
  };

  updateManyUsers = async (req: Request, res: Response) => {
    try {
      const { error, value } = UserSchemaValidation.validate(req.body);

      if (error) {
        return res.status(400).send(error.message);
      }

      const users = await userServices.updateManyUsers(value);
      res.status(200).send(users);
    } catch (err: any) {
      res.status(500).send(err.message);
    }
  };

  deleteUser = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const user = await userServices.deleteUser(id);

      if (!user) {
        return res.status(404).send("User not found");
      }

      res.status(200).send(user);
    } catch (err: any) {
      res.status(500).send(err.message);
    }
  };
}

export const userController = new UserController();
