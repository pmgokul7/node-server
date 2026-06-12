import { Router } from "express";
import { verifyJWT } from "../middlewares/jwt.js";
import {
    createWorkSpace,
    deleteWorkSpace,
    getMyWorkSpaces,
    getOwnedWorkspacesHandler,
    getWorkSpaceById,
    getWorkspaceKey,
    getWorkspaceKeyRecipientsHandler,
    saveWorkspaceEncryptedPem,
    saveWorkspaceKeySharesHandler,
    updateWorkSpace,
} from "../controllers/workspace.controller.js";
const workspaceRoute = Router();

// route to initiate kyc
workspaceRoute.get("/",verifyJWT,getMyWorkSpaces);

workspaceRoute.get("/owned", verifyJWT, getOwnedWorkspacesHandler);

workspaceRoute.post("/",verifyJWT,createWorkSpace);

workspaceRoute.patch("/:id",verifyJWT,updateWorkSpace);

workspaceRoute.delete("/:id",verifyJWT,deleteWorkSpace);

workspaceRoute.get("/:id/workspace-key", verifyJWT, getWorkspaceKey);

workspaceRoute.get("/:id/key-recipients", verifyJWT, getWorkspaceKeyRecipientsHandler);

workspaceRoute.post("/:id/workspace-key-shares", verifyJWT, saveWorkspaceKeySharesHandler);

workspaceRoute.post("/:id/encrypted-pem", verifyJWT, saveWorkspaceEncryptedPem);

workspaceRoute.get("/:id",verifyJWT,getWorkSpaceById);



export default workspaceRoute;