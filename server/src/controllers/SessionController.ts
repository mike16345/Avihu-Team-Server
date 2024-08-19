import { Request, Response } from "express";
import SessionService from "../services/sessionService";
import { StatusCode } from "../enums/StatusCode";
import mongoose from "mongoose";
import { ISessionCreate } from "../models/sessionModel";

export default class SessionController {
  static async startSession(req: Request, res: Response) {
    const { userId, type, data } = req.body;
    const session: ISessionCreate = {
      userId,
      type,
      data,
    };

    try {
      const result = await SessionService.startSession(session);

      res.status(StatusCode.CREATED).send(result);
    } catch (err: any) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  }

  static async refreshSession(req: Request, res: Response) {
    const sessionId = req.params.sessionId;

    try {
      const session = await SessionService.refreshSession(sessionId);

      if (!session) {
        return res.status(StatusCode.NOT_FOUND).send({ message: "Session not found!" });
      }

      res.status(StatusCode.OK).send(session);
    } catch (err: any) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  }

  static async endSession(req: Request, res: Response) {
    const sessionId = req.params.sessionId;

    try {
      await SessionService.endSession(sessionId);

      res.status(StatusCode.NO_CONTENT).send();
    } catch (err: any) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  }

  static async getSessionById(req: Request, res: Response) {
    const sessionId = req.params.sessionId;
    try {
      const session = await SessionService.getSessionById(sessionId);
      if (!session) {
        return res.status(StatusCode.NOT_FOUND).send({ message: "Session not found." });
      }
      res.status(StatusCode.OK).send(session);
    } catch (err: any) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  }
}
