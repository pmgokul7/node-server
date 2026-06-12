import { Router } from "express";
import { getPricingPlans } from "../controllers/pricingPlan.controller.js";

const plansRoute = Router();

plansRoute.get("/", getPricingPlans);

export default plansRoute;
