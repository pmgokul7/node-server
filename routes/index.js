import { Router } from "express";
import authRoute from "./auth.js";

const route = Router();

// route to initiate kyc
route.use("/user", (req,res)=>{
    console.log("here");
});

route.use("/auth", authRoute);

export default route;