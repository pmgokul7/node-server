import PricingPlan from "../models/pricingPlan.model.js";
import { DEFAULT_PRICING_PLANS } from "../data/pricingPlans.seed.js";

function formatPlan(doc) {
    if (!doc) return null;

    const row = doc.toObject ? doc.toObject() : doc;
    const features = [...(row.features ?? [])].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );

    return {
        id: row.slug,
        slug: row.slug,
        name: row.name,
        price: row.price,
        period: row.period,
        description: row.description,
        highlighted: Boolean(row.highlighted),
        actionLabel: row.actionLabel,
        sortOrder: row.sortOrder ?? 0,
        cardVariant: row.cardVariant ?? "default",
        badge: row.badge ?? null,
        features: features.map((feature) => ({
            key: feature.key,
            label: feature.label,
            included: Boolean(feature.included),
            sortOrder: feature.sortOrder ?? 0,
        })),
    };
}

export async function ensurePricingPlansSeeded() {
    const count = await PricingPlan.countDocuments();
    if (count > 0) return;

    await PricingPlan.insertMany(DEFAULT_PRICING_PLANS);
}

export async function listPricingPlans() {
    const plans = await PricingPlan.find().sort({ sortOrder: 1, createdAt: 1 });
    return plans.map(formatPlan);
}

export async function getPricingPlanBySlug(slug) {
    const plan = await PricingPlan.findOne({ slug });
    return formatPlan(plan);
}
