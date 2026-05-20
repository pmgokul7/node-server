import { Router } from "express";
import { verifyJWT } from "../middlewares/jwt.js";
import { getMyWorkSpaces, createWorkSpace, updateWorkSpace, deleteWorkSpace } from "../controllers/workspace.controller.js";
const workspaceRoute = Router();

// route to initiate kyc
workspaceRoute.get("/",verifyJWT,getMyWorkSpaces);

workspaceRoute.post("/",verifyJWT,createWorkSpace);

workspaceRoute.patch("/:id",verifyJWT,updateWorkSpace);

workspaceRoute.delete("/:id",verifyJWT,deleteWorkSpace);



export default workspaceRoute;