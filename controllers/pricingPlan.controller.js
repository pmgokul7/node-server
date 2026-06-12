import { sendError, sendSuccess } from "../helper/requestHandler.js";
import { listPricingPlans } from "../services/pricingPlan.service.js";

export const getPricingPlans = async (req, res) => {
    try {
        const plans = await listPricingPlans();
        await sendSuccess(req, res, "pricing plans found", 200, plans);
    } catch (error) {
        sendError(req, res, error);
    }
};
