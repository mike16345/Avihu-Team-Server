import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRouter from "./routers/users";
import weighInsRouter from "./routers/weighIns";
import workoutPlanRouter from "./routers/workoutPlans";
import exercisePresetRouter from "./routers/exercisePresets";

import "./db/mainConnection";
import router from "./routers";
import http from "http";

dotenv.config();
const port = process.env.SERVER_PORT;

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, "public")));
app.use("/users", userRouter);
app.use("/weighIns", weighInsRouter);
app.use("/workoutPlans", workoutPlanRouter);
app.use("/presets/exercises", exercisePresetRouter);

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export default app;
