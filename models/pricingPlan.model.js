import { Schema, model } from "mongoose";

const PlanFeatureSchema = new Schema(
    {
        key: { type: String, required: true },
        label: { type: String, required: true },
        included: { type: Boolean, required: true },
        sortOrder: { type: Number, default: 0 },
    },
    { _id: false },
);

const PricingPlanSchema = new Schema(
    {
        slug: { type: String, required: true, unique: true, trim: true },
        name: { type: String, required: true, trim: true },
        price: { type: String, required: true, trim: true },
        period: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        highlighted: { type: Boolean, default: false },
        actionLabel: { type: String, required: true, trim: true },
        sortOrder: { type: Number, default: 0 },
        cardVariant: {
            type: String,
            enum: ["default", "custom"],
            default: "default",
        },
        badge: { type: String, default: null },
        features: { type: [PlanFeatureSchema], default: [] },
    },
    { timestamps: true },
);

const PricingPlan = model(
    "PricingPlanSchema",
    PricingPlanSchema,
    "pricing_plans",
);

export default PricingPlan;
