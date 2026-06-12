const FEATURE_ORDER = [
    "hosts",
    "workspaces",
    "members",
    "encryption",
    "ssh",
    "key-sharing",
    "favorites",
    "email",
    "rbac",
    "audit",
    "sso",
    "dedicated",
    "sla",
    "account-manager",
    "deployment",
];

const FEATURE_LABELS = {
    encryption: "End-to-end encryption",
    ssh: "SSH terminal access",
    "key-sharing": "Workspace key sharing",
    favorites: "Host favorites & organization",
    email: "Email support",
    rbac: "Role-based access controls",
    audit: "Audit activity logs",
    sso: "SSO & custom integrations",
    dedicated: "Dedicated support",
    sla: "Tailored SLA",
    "account-manager": "Dedicated account manager",
    deployment: "On-premise or private cloud",
};

const PLAN_INCLUDED = {
    starter: new Set([
        "hosts",
        "workspaces",
        "members",
        "encryption",
        "ssh",
        "key-sharing",
    ]),
    pro: new Set([
        "hosts",
        "workspaces",
        "members",
        "encryption",
        "ssh",
        "key-sharing",
        "favorites",
        "email",
    ]),
    enterprise: new Set([
        "hosts",
        "workspaces",
        "members",
        "encryption",
        "ssh",
        "key-sharing",
        "favorites",
        "email",
        "rbac",
        "audit",
        "sso",
        "dedicated",
    ]),
    custom: new Set(FEATURE_ORDER),
};

const TIER_LABELS = {
    hosts: {
        starter: "5 hosts",
        pro: "20 hosts",
        enterprise: "Unlimited hosts",
        custom: "Custom host limits",
    },
    workspaces: {
        starter: "1 workspace",
        pro: "5 shared workspaces",
        enterprise: "Unlimited workspaces",
        custom: "Custom workspace limits",
    },
    members: {
        starter: "10 team members",
        pro: "50 team members",
        enterprise: "Unlimited team members",
        custom: "Custom team size",
    },
};

function buildFeatures(planSlug) {
    const included = PLAN_INCLUDED[planSlug];

    return FEATURE_ORDER.map((key, index) => ({
        key,
        label:
            TIER_LABELS[key]?.[planSlug] ??
            FEATURE_LABELS[key] ??
            key,
        included: included.has(key),
        sortOrder: index,
    }));
}

export const DEFAULT_PRICING_PLANS = [
    {
        slug: "starter",
        name: "Starter",
        price: "$0",
        period: "forever",
        description: "For solo developers getting started.",
        highlighted: false,
        actionLabel: "Current plan",
        sortOrder: 0,
        cardVariant: "default",
        badge: null,
        features: buildFeatures("starter"),
    },
    {
        slug: "pro",
        name: "Pro",
        price: "$12",
        period: "per month",
        description: "For teams sharing hosts and workspaces.",
        highlighted: true,
        actionLabel: "Upgrade",
        sortOrder: 1,
        cardVariant: "default",
        badge: "Most popular",
        features: buildFeatures("pro"),
    },
    {
        slug: "enterprise",
        name: "Enterprise",
        price: "$49",
        period: "per month",
        description: "For organizations with advanced needs.",
        highlighted: false,
        actionLabel: "Upgrade",
        sortOrder: 2,
        cardVariant: "default",
        badge: null,
        features: buildFeatures("enterprise"),
    },
    {
        slug: "custom",
        name: "Custom",
        price: "Custom",
        period: "pricing",
        description: "Fully tailored limits, deployment, and support.",
        highlighted: false,
        actionLabel: "Contact sales",
        sortOrder: 3,
        cardVariant: "custom",
        badge: "Fully customizable",
        features: buildFeatures("custom"),
    },
];
