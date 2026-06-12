import jwt from 'jsonwebtoken';
import UserSession from "../models/userSession.model.js";

export const verifyJWT = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Token missing' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decoded;

        if (!decoded.sessionId) {
            return res.status(401).json({
                message: "Session expired. Sign in again.",
                code: "SESSION_REVOKED",
            });
        }

        const session = await UserSession.findOne({
            sessionId: decoded.sessionId,
        }).select("signedOutAt userId");

        if (!session || session.signedOutAt) {
            return res.status(401).json({
                message: "Session expired. Sign in again.",
                code: "SESSION_REVOKED",
            });
        }

        if (String(session.userId) !== String(decoded.id)) {
            return res.status(403).json({ message: "Invalid session" });
        }

        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
}