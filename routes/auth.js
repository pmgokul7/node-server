import { Router } from "express";
import {
    getPrivateKey,
    getPersonalWorkspaceKey,
    getPublicKey,
    loginUser,
    logoutUser,
    registerUser,
    savePersonalWorkspaceKey,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/jwt.js";
import { sendError, sendSuccess } from "../helper/requestHandler.js";
import {
    helper_getMyWorkSpaces,
    resolveUserEmail,
} from "../services/workspace.service.js";

const authRoute = Router();

// route to initiate kyc
authRoute.post("/login",loginUser);

authRoute.post("/logout", verifyJWT, logoutUser);

authRoute.post("/register",registerUser)

authRoute.get("/public-key", verifyJWT, getPublicKey);

authRoute.get("/private-key", verifyJWT, getPrivateKey);

authRoute.get("/personal-workspace-key", verifyJWT, getPersonalWorkspaceKey);

authRoute.put("/personal-workspace-key", verifyJWT, savePersonalWorkspaceKey);

authRoute.get("/me", verifyJWT, async (req, res) => {
    try {
        const email = await resolveUserEmail(req);
        const workspaces = await helper_getMyWorkSpaces(req?.user?.id, email);

        await sendSuccess(req, res, "user profile", 200, {
            ...req.user,
            email: email ?? req.user?.email,
            workspaces,
        });
    } catch (error) {
        sendError(req, res, error);
    }
});

export default authRoute;