import { Router } from "express";
import { verifyJWT } from "../middlewares/jwt.js";
import {
    createHost,
    deleteHost,
    listHosts,
    removeHostFromWorkspace,
    setHostFavorite,
    updateHost,
} from "../controllers/host.controller.js";

const hostRoute = Router();

hostRoute.get("/", verifyJWT, listHosts);
hostRoute.post("/", verifyJWT, createHost);
hostRoute.patch("/:id/favorite", verifyJWT, setHostFavorite);
hostRoute.patch("/:id/remove-from-workspace", verifyJWT, removeHostFromWorkspace);
hostRoute.patch("/:id", verifyJWT, updateHost);
hostRoute.delete("/:id", verifyJWT, deleteHost);

export default hostRoute;
