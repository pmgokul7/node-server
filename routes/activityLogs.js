import { Router } from "express";
import { verifyJWT } from "../middlewares/jwt.js";
import { getMyActivityLogs } from "../controllers/activityLog.controller.js";

const activityLogsRoute = Router();

activityLogsRoute.get("/", verifyJWT, getMyActivityLogs);

export default activityLogsRoute;
