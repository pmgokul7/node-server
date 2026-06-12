import { randomUUID } from "crypto";
import { Types } from "mongoose";
import UserSession from "../models/userSession.model.js";

export async function createUserSession({ userId, ipAddress = null, platform }) {
    const sessionId = randomUUID();

    const session = await UserSession.create({
        sessionId,
        userId: new Types.ObjectId(userId),
        signedInAt: new Date(),
        ipAddress: ipAddress || null,
        platform,
    });

    return session;
}

export async function countActiveSessions(userId) {
    return UserSession.countDocuments({
        userId: new Types.ObjectId(userId),
        signedOutAt: null,
    });
}

export async function endAllActiveSessions(userId) {
    const result = await UserSession.updateMany(
        {
            userId: new Types.ObjectId(userId),
            signedOutAt: null,
        },
        { signedOutAt: new Date() },
    );

    return result.modifiedCount;
}

export async function endUserSession({ sessionId, userId }) {
    if (!sessionId) return null;

    return UserSession.findOneAndUpdate(
        {
            sessionId,
            userId: new Types.ObjectId(userId),
            signedOutAt: null,
        },
        { signedOutAt: new Date() },
        { new: true },
    );
}
