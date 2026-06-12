import Joi from "joi";
import { Types } from "mongoose";
import { sendError, sendSuccess } from "../helper/requestHandler.js";
import { throwCustomError } from "../helper/error.js";
import HostFavorite from "../models/hostFavorite.model.js";
import Host from "../models/hosts.model.js";
import WorkSpace from "../models/workSpaces.model.js";

function assertValidWorkspaceId(id) {
    if (!Types.ObjectId.isValid(id)) {
        throwCustomError(1012);
    }
}

async function assertWorkspaceMember(workspaceId, userId) {
    assertValidWorkspaceId(workspaceId);
    const workspace = await WorkSpace.findOne({
        _id: new Types.ObjectId(workspaceId),
        members: new Types.ObjectId(userId),
    });
    if (!workspace) {
        throwCustomError(1011);
    }
    return workspace;
}

async function assertWorkspaceOwner(workspaceId, userId) {
    assertValidWorkspaceId(workspaceId);
    const workspace = await WorkSpace.findOne({
        _id: new Types.ObjectId(workspaceId),
        createdBy: new Types.ObjectId(userId),
    });
    if (!workspace) {
        throwCustomError(1016);
    }
    return workspace;
}

function hostPayload(body) {
    return {
        name: body.name?.trim(),
        address: (body.host ?? body.address)?.trim(),
        port: Number(body.port) || 22,
        username: body.username?.trim(),
        authType: body.authType === "password" ? "password" : "pem",
        encryptedPem: body.encryptedPem?.trim() || undefined,
        pemFileName: body.pemFileName?.trim() || undefined,
    };
}

function formatHost(doc, isFavorite = false) {
    if (!doc) return null;
    const row = doc.toObject ? doc.toObject() : doc;
    return {
        id: String(row._id ?? row.id),
        name: row.name,
        host: row.address,
        port: row.port,
        username: row.username,
        authType: row.authType,
        encryptedPem: row.encryptedPem ?? "",
        pemFileName: row.pemFileName ?? "",
        workspaceId: row.workspaceId ? String(row.workspaceId) : null,
        createdBy: row.createdBy ? String(row.createdBy) : undefined,
        isFavorite,
    };
}

async function assertHostAccess(host, userId) {
    if (!host) {
        throwCustomError(1014);
    }

    if (!host.workspaceId) {
        if (String(host.createdBy) !== String(userId)) {
            throwCustomError(1014);
        }
        return;
    }

    await assertWorkspaceMember(String(host.workspaceId), userId);
}

export const listHosts = async (req, res) => {
    try {
        const userId = req?.user?.id;
        const { workspaceId } = req.query;

        const memberships = await WorkSpace.find({
            members: new Types.ObjectId(userId),
        }).select("_id");
        const allowedIds = memberships.map((w) => w._id);

        const filter = {
            $or: [
                { workspaceId: { $in: allowedIds } },
                { createdBy: new Types.ObjectId(userId), workspaceId: { $exists: false } },
                { createdBy: new Types.ObjectId(userId), workspaceId: null },
            ],
        };
        if (workspaceId) {
            assertValidWorkspaceId(workspaceId);
            await assertWorkspaceMember(workspaceId, userId);
            filter.workspaceId = new Types.ObjectId(workspaceId);
        }

        const hosts = await Host.find(filter).sort({ createdAt: -1 });
        const hostIds = hosts.map((host) => host._id);
        const favorites = await HostFavorite.find({
            userId: new Types.ObjectId(userId),
            hostId: { $in: hostIds },
        }).select("hostId");
        const favoriteIds = new Set(favorites.map((favorite) => String(favorite.hostId)));
        await sendSuccess(
            req,
            res,
            "hosts found",
            200,
            hosts.map((host) => formatHost(host, favoriteIds.has(String(host._id)))),
        );
    } catch (error) {
        sendError(req, res, error);
    }
};

export const createHost = async (req, res) => {
    try {
        const userId = req?.user?.id;
        const schema = Joi.object({
            workspaceId: Joi.string().allow(null, "").optional(),
            name: Joi.string().required(),
            host: Joi.string().optional(),
            address: Joi.string().optional(),
            port: Joi.number().integer().min(1).max(65535).optional(),
            username: Joi.string().required(),
            authType: Joi.string().valid("pem", "password").optional(),
            encryptedPem: Joi.string().allow("").optional(),
            pemFileName: Joi.string().optional(),
        })
            .or("host", "address");
        const { error, value } = schema.validate(req.body);
        if (error) {
            throwCustomError(1006);
        }

        const authType = value.authType === "password" ? "password" : "pem";

        const workspaceId = value.workspaceId?.trim();
        if (workspaceId) {
            await assertWorkspaceOwner(workspaceId, userId);
        }

        const created = await Host.create({
            ...(workspaceId ? { workspaceId: new Types.ObjectId(workspaceId) } : {}),
            createdBy: new Types.ObjectId(userId),
            ...hostPayload(value),
        });

        await sendSuccess(req, res, "host created", 201, formatHost(created));
    } catch (error) {
        sendError(req, res, error);
    }
};

export const updateHost = async (req, res) => {
    try {
        const userId = req?.user?.id;
        const { id } = req.params;

        if (!Types.ObjectId.isValid(id)) {
            throwCustomError(1012);
        }

        const schema = Joi.object({
            name: Joi.string().optional(),
            host: Joi.string().optional(),
            address: Joi.string().optional(),
            port: Joi.number().integer().min(1).max(65535).optional(),
            username: Joi.string().optional(),
            authType: Joi.string().valid("pem", "password").optional(),
            encryptedPem: Joi.string().optional(),
            pemFileName: Joi.string().optional(),
            workspaceId: Joi.string().optional(),
        });
        const { error, value } = schema.validate(req.body);
        if (error) {
            throwCustomError(1006);
        }

        const existing = await Host.findById(id);
        if (!existing) {
            throwCustomError(1014);
        }

        if (existing.workspaceId) {
            await assertWorkspaceMember(String(existing.workspaceId), userId);
        } else if (String(existing.createdBy) !== String(userId)) {
            throwCustomError(1014);
        }

        if (value.workspaceId) {
            await assertWorkspaceMember(value.workspaceId, userId);
            existing.workspaceId = new Types.ObjectId(value.workspaceId);
        } else if (value.workspaceId === null || value.workspaceId === "") {
            existing.workspaceId = undefined;
        }

        if (value.name != null) existing.name = value.name.trim();
        if (value.host != null) existing.address = value.host.trim();
        if (value.address != null) existing.address = value.address.trim();
        if (value.port != null) existing.port = Number(value.port) || 22;
        if (value.username != null) existing.username = value.username.trim();
        if (value.authType != null) {
            existing.authType = value.authType === "password" ? "password" : "pem";
        }
        if (value.encryptedPem != null) existing.encryptedPem = value.encryptedPem.trim();
        if (value.pemFileName != null) existing.pemFileName = value.pemFileName.trim();
        await existing.save();

        const favorite = await HostFavorite.exists({
            userId: new Types.ObjectId(userId),
            hostId: existing._id,
        });
        await sendSuccess(req, res, "host updated", 200, formatHost(existing, Boolean(favorite)));
    } catch (error) {
        sendError(req, res, error);
    }
};

export const setHostFavorite = async (req, res) => {
    try {
        const userId = req?.user?.id;
        const { id } = req.params;

        if (!Types.ObjectId.isValid(id)) {
            throwCustomError(1012);
        }

        const schema = Joi.object({
            favorite: Joi.boolean().required(),
        });
        const { error, value } = schema.validate(req.body);
        if (error) {
            throwCustomError(1006);
        }

        const host = await Host.findById(id);
        await assertHostAccess(host, userId);

        const query = {
            hostId: new Types.ObjectId(id),
            userId: new Types.ObjectId(userId),
        };

        if (value.favorite) {
            await HostFavorite.findOneAndUpdate(query, query, { upsert: true, new: true });
        } else {
            await HostFavorite.deleteOne(query);
        }

        await sendSuccess(req, res, "host favorite updated", 200, {
            id,
            isFavorite: value.favorite,
        });
    } catch (error) {
        sendError(req, res, error);
    }
};

export const removeHostFromWorkspace = async (req, res) => {
    try {
        const userId = req?.user?.id;
        const { id } = req.params;

        if (!Types.ObjectId.isValid(id)) {
            throwCustomError(1012);
        }

        const host = await Host.findById(id);
        if (!host) {
            throwCustomError(1014);
        }
        if (!host.workspaceId) {
            await sendSuccess(req, res, "host removed from workspace", 200, formatHost(host));
            return;
        }

        await assertWorkspaceOwner(String(host.workspaceId), userId);
        host.workspaceId = undefined;
        await host.save();

        const favorite = await HostFavorite.exists({
            userId: new Types.ObjectId(userId),
            hostId: host._id,
        });
        await sendSuccess(
            req,
            res,
            "host removed from workspace",
            200,
            formatHost(host, Boolean(favorite)),
        );
    } catch (error) {
        sendError(req, res, error);
    }
};

export const deleteHost = async (req, res) => {
    try {
        const userId = req?.user?.id;
        const { id } = req.params;

        if (!Types.ObjectId.isValid(id)) {
            throwCustomError(1012);
        }

        const existing = await Host.findById(id);
        if (!existing) {
            throwCustomError(1014);
        }

        await assertHostAccess(existing, userId);
        await Host.findByIdAndDelete(id);
        await HostFavorite.deleteMany({ hostId: existing._id });

        await sendSuccess(req, res, "host deleted", 200, { id });
    } catch (error) {
        sendError(req, res, error);
    }
};
