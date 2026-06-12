import { Types } from "mongoose";
import WorkSpace from "../models/workSpaces.model.js";
import UserKeys from "../models/userKeys.model.js";
import { User } from "../models/user.model.js";
import MemberInvite from "../models/memberInvites.js";
import WorkspaceKeyShare from "../models/workspaceKeyShare.model.js";

export async function getOwnedWorkspaces(ownerId) {
    return WorkSpace.find({
        createdBy: new Types.ObjectId(ownerId),
    })
        .select("name workspaceKey createdBy members")
        .lean();
}

/**
 * Members who accepted invite (or are in members list) and have a registered public key.
 */
export async function findWorkspaceForOwner(workspaceId, ownerId) {
    const workspace = await WorkSpace.findById(workspaceId).select("createdBy").lean();
    if (!workspace) {
        return { status: "not_found" };
    }
    if (String(workspace.createdBy) !== String(ownerId)) {
        return { status: "forbidden" };
    }
    return { status: "ok" };
}

export async function getWorkspaceKeyRecipients(workspaceId, ownerId) {
    const access = await findWorkspaceForOwner(workspaceId, ownerId);
    if (access.status === "not_found") {
        return null;
    }
    if (access.status === "forbidden") {
        return { forbidden: true };
    }

    const workspace = await WorkSpace.findById(workspaceId).lean();

    const ownerIdStr = String(ownerId);
    const memberIds = (workspace.members ?? [])
        .map((m) => String(m))
        .filter((id) => id !== ownerIdStr);

    if (memberIds.length === 0) {
        return [];
    }

    const acceptedInvites = await MemberInvite.find({
        workspaceId: new Types.ObjectId(workspaceId),
        status: "accepted",
    }).lean();

    const acceptedEmails = new Set(
        acceptedInvites.map((inv) => inv.email?.trim().toLowerCase()).filter(Boolean),
    );

    const users = await User.find({
        _id: { $in: memberIds.map((id) => new Types.ObjectId(id)) },
    })
        .select("email")
        .lean();

    const eligibleUserIds = users
        .filter((u) => acceptedEmails.has(u.email?.trim().toLowerCase()))
        .map((u) => String(u._id));

    if (eligibleUserIds.length === 0) {
        return [];
    }

    const keyRows = await UserKeys.find({
        userId: { $in: eligibleUserIds.map((id) => new Types.ObjectId(id)) },
    })
        .select("userId publicKey")
        .lean();

    return keyRows
        .filter((row) => row.publicKey)
        .map((row) => ({
            userId: String(row.userId),
            publicKey: row.publicKey,
            email: users.find((u) => String(u._id) === String(row.userId))?.email ?? null,
        }));
}

export async function upsertWorkspaceKeyShares(workspaceId, ownerId, shares) {
    const access = await findWorkspaceForOwner(workspaceId, ownerId);
    if (access.status === "not_found") {
        return null;
    }
    if (access.status === "forbidden") {
        return { forbidden: true };
    }

    const ops = shares.map((share) =>
        WorkspaceKeyShare.findOneAndUpdate(
            {
                workspaceId: new Types.ObjectId(workspaceId),
                userId: new Types.ObjectId(share.userId),
            },
            {
                encryptedWorkspaceKey: share.encryptedWorkspaceKey.trim(),
            },
            { upsert: true, new: true },
        ),
    );

    const saved = await Promise.all(ops);
    return saved.map((doc) => ({
        userId: String(doc.userId),
        workspaceId: String(doc.workspaceId),
    }));
}

/**
 * Owner → workspace.workspaceKey on the workspace document.
 * Member → encryptedWorkspaceKey from shellix_workspace_key_shares.
 */
function toObjectId(value) {
    if (!value) return null;
    if (value instanceof Types.ObjectId) return value;
    const str = String(value);
    if (!Types.ObjectId.isValid(str)) return null;
    return new Types.ObjectId(str);
}

export async function getEncryptedWorkspaceKeyForUser(workspaceId, userId) {
    const userObjectId = toObjectId(userId);
    const workspaceObjectId = toObjectId(workspaceId);
    if (!userObjectId || !workspaceObjectId) {
        return { error: "not_member" };
    }

    const workspace = await WorkSpace.findOne({
        _id: workspaceObjectId,
        members: userObjectId,
    }).select("workspaceKey createdBy");

    if (!workspace) {
        return { error: "not_member" };
    }

    const isOwner = workspace.createdBy.equals(userObjectId);

    if (isOwner) {
        if (!workspace.workspaceKey?.trim()) {
            return { error: "no_workspace_key" };
        }
        return {
            encryptedWorkspaceKey: workspace.workspaceKey,
            keySource: "workspace",
            isOwner: true,
        };
    }

    const share = await WorkspaceKeyShare.findOne({
        workspaceId: workspaceObjectId,
        userId: userObjectId,
    }).select("encryptedWorkspaceKey");

    if (!share?.encryptedWorkspaceKey?.trim()) {
        return { error: "no_share" };
    }

    return {
        encryptedWorkspaceKey: share.encryptedWorkspaceKey,
        keySource: "share",
        isOwner: false,
    };
}
