import { Router } from "express";
import { verifyJWT } from "../middlewares/jwt.js";
import { acceptMemberInvite } from "../controllers/memberInvite.controller.js";

const memberInviteRoute = Router();

memberInviteRoute.post("/:inviteId/accept", verifyJWT, acceptMemberInvite);

export default memberInviteRoute;
