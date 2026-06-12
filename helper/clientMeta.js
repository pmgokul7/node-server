import { PLATFORMS } from "../models/userSession.model.js";

export function getClientIp(req) {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.trim()) {
        return forwarded.split(",")[0].trim();
    }

    const realIp = req.headers["x-real-ip"];
    if (typeof realIp === "string" && realIp.trim()) {
        return realIp.trim();
    }

    const remote = req.socket?.remoteAddress ?? req.connection?.remoteAddress;
    if (typeof remote === "string" && remote.trim()) {
        return remote.replace(/^::ffff:/, "");
    }

    if (typeof req.ip === "string" && req.ip.trim()) {
        return req.ip.replace(/^::ffff:/, "");
    }

    return null;
}

export function normalizePlatform(value) {
    const platform = String(value ?? "web")
        .trim()
        .toLowerCase();

    if (PLATFORMS.includes(platform)) {
        return platform;
    }

    return "web";
}
