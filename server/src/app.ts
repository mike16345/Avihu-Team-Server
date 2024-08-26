import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import "./db/mainConnection";
import appRouter from "./routers";
import http from "http";
import { StatusCode } from "./enums/StatusCode";
import serverless from "serverless-http";

dotenv.config();

const PORT = process.env.SERVER_PORT;
const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cors());

app.use("/", appRouter);
app.get("/aws", (req, res) => res.send("Hello AWS!"));

app.use("*", (req, res) => {
  res.status(StatusCode.BAD_REQUEST).send({ message: "Route not found" });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: "An unexpected error occurred" });
});

if (!PORT) {
  console.error("PORT environment variable not found");
}

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports.handler = serverless(app);
