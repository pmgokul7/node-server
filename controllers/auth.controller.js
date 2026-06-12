import Joi from "joi";
import { sendError, sendSuccess } from "../helper/requestHandler.js";
import { throwCustomError } from "../helper/error.js";
import * as jwt_decode from "jwt-decode";
import { User } from "../models/user.model.js";
import UserKeys from "../models/userKeys.model.js";
import { Types } from "mongoose";
import jwt from 'jsonwebtoken';
import { isValidEmail } from "../helper/utilities.js";
import bcrypt from "bcrypt";
import { getClientIp, normalizePlatform } from "../helper/clientMeta.js";
import {
    createUserSession,
    countActiveSessions,
    endAllActiveSessions,
    endUserSession,
} from "../services/userSession.service.js";

export const loginUser = async (req, res) => {
    try {
        const body = req.body;
        console.log(body)
        const schema = Joi.object({
            email: Joi.string().email().optional(),
            password: Joi.string().min(6).optional(),
            platform: Joi.string()
                .valid("windows", "macos", "linux", "web")
                .optional(),
            forceLogin: Joi.boolean().optional(),
        })
        const { error } = schema.validate(body)
        if (error) {
            throwCustomError(1006)
        }
        let userExists = await User.findOne({
            email: body?.email
        })

        if (!userExists) {
            throwCustomError(1008)
        }

        const resopnse = {
            email: userExists?.email,
            id: String(userExists._id),
        };

        const isPasswordValid = await bcrypt.compare(body.password, userExists.password);

        if (!isPasswordValid) {
            throwCustomError(1008)
        }

        const forceLogin = Boolean(body.forceLogin);
        const activeSessionCount = await countActiveSessions(userExists._id);

        if (activeSessionCount > 0 && !forceLogin) {
            await sendSuccess(req, res, "active session exists", 200, {
                requiresSessionConfirmation: true,
                activeSessionCount,
            });
            return;
        }

        if (activeSessionCount > 0 && forceLogin) {
            await endAllActiveSessions(userExists._id);
        }

        const session = await createUserSession({
            userId: userExists._id,
            ipAddress: getClientIp(req),
            platform: normalizePlatform(body.platform),
        });
        
        const token = jwt.sign(
            { ...resopnse, sessionId: session.sessionId },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: process.env.JWT_EXPIRES_IN,
            },
        );
        const refreshToken = jwt.sign(
            { ...resopnse, sessionId: session.sessionId },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: "30d",
            },
        );

        const userKeys = await UserKeys.findOne({ userId: userExists._id })
            .select("publicKey encryptedPrivateKey");

        const response = {
            token,
            refreshToken,
            sessionId: session.sessionId,
            email: userExists?.email,
            id: userExists?._id,
            publicKey: userKeys?.publicKey,
            encryptedPrivateKey: userKeys?.encryptedPrivateKey,
        }

        await sendSuccess(req, res, "user logged in", 200, response)

    } catch (error) {
        sendError(req, res, error)
    }
}

export const logoutUser = async (req, res) => {
    try {
        const userId = req?.user?.id;
        const schema = Joi.object({
            sessionId: Joi.string().uuid().optional(),
        });
        const { error, value } = schema.validate(req.body ?? {});
        if (error) {
            throwCustomError(1006);
        }

        const sessionId = value?.sessionId ?? req.user?.sessionId;
        if (!sessionId) {
            await sendSuccess(req, res, "user logged out", 200, { sessionId: null });
            return;
        }

        const ended = await endUserSession({ sessionId, userId });
        await sendSuccess(req, res, "user logged out", 200, {
            sessionId,
            signedOutAt: ended?.signedOutAt ?? null,
        });
    } catch (error) {
        sendError(req, res, error);
    }
};


export const getPrivateKey = async (req, res) => {
    try {
        const userId = req?.user?.id;
        const userKeys = await UserKeys.findOne({
            userId: new Types.ObjectId(userId),
        }).select("encryptedPrivateKey authTag salt iv");

        if (!userKeys?.encryptedPrivateKey) {
            throwCustomError(1009);
        }

        await sendSuccess(req, res, "private key bundle found", 200, {
            encryptedPrivateKey: userKeys.encryptedPrivateKey,
            authTag: userKeys.authTag ?? "",
            salt: userKeys.salt ?? "",
            iv: userKeys.iv ?? "",
        });
    } catch (error) {
        sendError(req, res, error);
    }
};

export const getPublicKey = async (req, res) => {
    try {
        const userId = req?.user?.id;
        const userKeys = await UserKeys.findOne({
            userId: new Types.ObjectId(userId),
        }).select("publicKey");

        if (!userKeys?.publicKey) {
            throwCustomError(1009);
        }

        await sendSuccess(req, res, "public key found", 200, {
            publicKey: userKeys.publicKey,
        });
    } catch (error) {
        sendError(req, res, error);
    }
};

export const getPersonalWorkspaceKey = async (req, res) => {
    try {
        const userId = req?.user?.id;
        const userKeys = await UserKeys.findOne({
            userId: new Types.ObjectId(userId),
        }).select("personalWorkspaceKey");

        await sendSuccess(req, res, "personal workspace key found", 200, {
            personalWorkspaceKey: userKeys?.personalWorkspaceKey ?? "",
        });
    } catch (error) {
        sendError(req, res, error);
    }
};

export const savePersonalWorkspaceKey = async (req, res) => {
    try {
        const userId = req?.user?.id;
        const schema = Joi.object({
            personalWorkspaceKey: Joi.string().required(),
        });
        const { error, value } = schema.validate(req.body);
        if (error) {
            throwCustomError(1006);
        }

        const userKeys = await UserKeys.findOneAndUpdate(
            { userId: new Types.ObjectId(userId) },
            { personalWorkspaceKey: value.personalWorkspaceKey.trim() },
            { new: true },
        ).select("personalWorkspaceKey");

        if (!userKeys) {
            throwCustomError(1009);
        }

        await sendSuccess(req, res, "personal workspace key saved", 200, {
            personalWorkspaceKey: userKeys.personalWorkspaceKey ?? "",
        });
    } catch (error) {
        sendError(req, res, error);
    }
};

export const registerUser = async (req, res) => {
    try {
        const body = req.body;
        console.log(body)
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required(),
            confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
            publicKey: Joi.string().required(),
            encryptedPrivateKey: Joi.string().required(),
            personalWorkspaceKey: Joi.string().optional(),
            authTag: Joi.string().required(),
            salt: Joi.string().required(),
            iv: Joi.string().required(),
        })
        const { error } = schema.validate(body)
        if (error) {
            throwCustomError(1006)
        }

        let userExists = await User.findOne({
            email: body?.email
        })

        if (userExists) {
            throwCustomError(1007)
        }
        
        const user = await User.create({
            email: body?.email,
            password: await bcrypt.hash(body.password, 10),
        });

        await UserKeys.create({
            userId: user._id,
            publicKey: body.publicKey,
            encryptedPrivateKey: body.encryptedPrivateKey,
            personalWorkspaceKey: body.personalWorkspaceKey,
            authTag: body.authTag,
            salt: body.salt,
            iv: body.iv,
        });

        const { password, ...userWithoutPassword } = user.toObject();
        await sendSuccess(req, res, "user created", 201, userWithoutPassword)
    } catch (error) {
        console.log(error)
        sendError(req, res, error)
    }
}


