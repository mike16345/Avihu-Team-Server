import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import "./db/mainConnection";
import appRouter from "./routers";
import http from "http";

dotenv.config();

const PORT = process.env.SERVER_PORT;
const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cors());

app.use("/", router);

app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "An unexpected error occurred" });
});

if (!PORT) {
  console.error("PORT environment variable not found");
}

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
