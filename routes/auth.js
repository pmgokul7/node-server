import { Router } from "express";
import { loginUser, registerUser } from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/jwt.js";
import { helper_getMyWorkSpaces } from "../services/workspace.service.js";

const authRoute = Router();

// route to initiate kyc
authRoute.post("/login",loginUser);

authRoute.post("/register",registerUser)

authRoute.get("/me", verifyJWT, async (req, res) => {
    try {
        const workspaces = await helper_getMyWorkSpaces(req?.user?.id);
        res.json({...req.user, workspaces});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default authRoute;