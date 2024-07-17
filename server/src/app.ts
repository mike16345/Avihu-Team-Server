import express from "express";
import dotenv from "dotenv";
import path from "path";
import http from "http";
import cors from "cors";
import userRouter from "./routers/users";
import weighInsRouter from "./routers/weighIns";
import workoutPlanRouter from "./routers/workoutPlans";
import recordedSetsRouter from "./routers/recordedSets";
import dietPlansRouter from "./routers/dietPlans";

import "./db/mainConnection";

dotenv.config();

const PORT = "3002";
const app = express();

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, "public")));
app.use("/users", userRouter);
app.use("/weighIns", weighInsRouter);
app.use("/dietPlans", dietPlansRouter);
app.use("/workoutPlans", workoutPlanRouter);
app.use("/recordedSets", recordedSetsRouter);

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
