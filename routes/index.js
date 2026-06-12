import { Router } from "express";
import authRoute from "./auth.js";
import workspaceRoute from "./workspaces.js";
import memberInviteRoute from "./memberInvites.js";
import hostRoute from "./hosts.js";
import plansRoute from "./plans.js";
import activityLogsRoute from "./activityLogs.js";
import { activityLogMiddleware } from "../middlewares/activityLog.middleware.js";

const route = Router();

route.use(activityLogMiddleware);

// route to initiate kyc
route.use("/user", (req,res)=>{
    console.log("here");
});

route.use("/auth", authRoute);

route.use("/workspaces", workspaceRoute);

route.use("/member-invites", memberInviteRoute);

route.use("/hosts", hostRoute);

route.use("/plans", plansRoute);

route.use("/activity-logs", activityLogsRoute);

export default route;