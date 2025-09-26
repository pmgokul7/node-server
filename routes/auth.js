import { Router } from "express";
import { loginUser, registerUser } from "../controllers/auth.controller.js";

const authRoute = Router();

// route to initiate kyc
authRoute.post("/login",loginUser);

authRoute.post("/register",registerUser)


export default authRoute;