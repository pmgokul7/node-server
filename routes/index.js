import { Router } from "express";
import authRoute from "./auth.js";
import workspaceRoute from "./workspaces.js";

const route = Router();

// route to initiate kyc
route.use("/user", (req,res)=>{
    console.log("here");
});

route.use("/auth", authRoute);

route.use("/workspaces", workspaceRoute);

export default route;