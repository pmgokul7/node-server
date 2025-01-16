import { Router } from "express";

const route = Router();

// route to initiate kyc
route.use("/user", (req,res)=>{
    console.log("here");
});

route.use("/auth", (req,res)=>{
    console.log("here");
});

export default route;