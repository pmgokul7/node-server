import WorkSpace from "../models/workSpaces.model.js";
import MemberInvite from "../models/memberInvites.js";
import { User } from "../models/user.model.js";
import { Types } from "mongoose";

export async function resolveUserEmail(req) {
    let email = req?.user?.email;
    if (!email && req?.user?.id) {
        const user = await User.findById(req.user.id).select("email");
        email = user?.email;
    }
    return email?.trim().toLowerCase() || undefined;
}

function toObjectId(value) {
    if (!value) return null;
    if (value instanceof Types.ObjectId) return value;
    const str = String(value);
    if (!Types.ObjectId.isValid(str)) return null;
    return new Types.ObjectId(str);
}

function formatWorkspaceRow(workspace, membership, inviteStatus, invite) {
    return {
        ...workspace,
        membership,
        inviteStatus,
        wasInvited: Boolean(invite),
        memberInviteId: invite?._id ? String(invite._id) : null,
        inviteId: invite?.inviteId ?? null,
    };
}

function pickInvitePerWorkspace(invites) {
    const byWorkspace = new Map();
    const priority = { accepted: 3, pending: 2, rejected: 1 };

    for (const inv of invites) {
        const wsId = String(inv.workspaceId);
        const existing = byWorkspace.get(wsId);
        if (!existing || (priority[inv.status] ?? 0) > (priority[existing.status] ?? 0)) {
            byWorkspace.set(wsId, inv);
        }
    }
    return byWorkspace;
}

/**
 * Workspaces the user belongs to, plus pending/accepted invite history for their email.
 */
export const helper_getMyWorkSpaces = async (userId, userEmail) => {
    const userObjectId = toObjectId(userId);
    if (!userObjectId) {
        return [];
    }

    const email = userEmail?.trim().toLowerCase();

    let inviteByWorkspaceId = new Map();
    if (email) {
        const invites = await MemberInvite.find({ email }).lean();
        inviteByWorkspaceId = pickInvitePerWorkspace(invites);

        // Repair: accepted invite but missing from members (e.g. wrong account accepted earlier)
        const orphanAccepted = [...inviteByWorkspaceId.values()].filter(
            (inv) => inv.status === "accepted",
        );
        if (orphanAccepted.length > 0) {
            await Promise.all(
                orphanAccepted.map((inv) =>
                    WorkSpace.updateOne(
                        { _id: inv.workspaceId },
                        { $addToSet: { members: userObjectId } },
                    ),
                ),
            );
        }
    }

    const memberWorkspaces = await WorkSpace.find({
        members: userObjectId,
    }).lean();

    const memberIds = new Set(memberWorkspaces.map((w) => String(w._id)));

    const memberRows = memberWorkspaces.map((w) => {
        const inv = inviteByWorkspaceId.get(String(w._id));

        if (inv?.status === "accepted") {
            return formatWorkspaceRow(w, "invited", "accepted", inv);
        }
        if (String(w.createdBy) === String(userId)) {
            return formatWorkspaceRow(w, "owner", null, inv);
        }
        return formatWorkspaceRow(w, "member", null, inv);
    });

    if (!email) {
        return memberRows;
    }

    const pendingInvites = [...inviteByWorkspaceId.values()].filter(
        (inv) => inv.status === "pending" && !memberIds.has(String(inv.workspaceId)),
    );

    if (pendingInvites.length === 0) {
        return memberRows;
    }

    const pendingWorkspaces = await WorkSpace.find({
        _id: { $in: pendingInvites.map((inv) => inv.workspaceId) },
    }).lean();

    const pendingByWorkspaceId = new Map(
        pendingInvites.map((inv) => [String(inv.workspaceId), inv]),
    );

    const inviteRows = pendingWorkspaces.map((w) =>
        formatWorkspaceRow(
            w,
            "invited",
            "pending",
            pendingByWorkspaceId.get(String(w._id)),
        ),
    );

    return [...memberRows, ...inviteRows];
};
