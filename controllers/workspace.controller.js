import Joi from "joi";
import { sendError, sendSuccess } from "../helper/requestHandler.js";
import { throwCustomError } from "../helper/error.js";
import WorkSpace from "../models/workSpaces.model.js";
import {
    helper_getMyWorkSpaces,
    resolveUserEmail,
} from "../services/workspace.service.js";
import {
    getEncryptedWorkspaceKeyForUser,
    getOwnedWorkspaces,
    getWorkspaceKeyRecipients,
    upsertWorkspaceKeyShares,
} from "../services/workspaceKeyShare.service.js";
import MemberInvite from "../models/memberInvites.js";
import { Types } from "mongoose";
import { v4 as uuidv4 } from 'uuid';

export const getOwnedWorkspacesHandler = async (req, res) => {
    try {
        const userId = req?.user?.id;
        const owned = await getOwnedWorkspaces(userId);
        const rows = owned.map((w) => ({
            id: String(w._id),
            name: w.name,
            workspaceKey: w.workspaceKey ?? "",
            createdBy: String(w.createdBy),
            memberCount: (w.members ?? []).length,
        }));
        await sendSuccess(req, res, "owned workspaces found", 200, rows);
    } catch (error) {
        sendError(req, res, error);
    }
};

export const getWorkspaceKeyRecipientsHandler = async (req, res) => {
    try {
        const userId = req?.user?.id;
        const { id } = req.params;
        assertValidWorkspaceId(id);

        const recipients = await getWorkspaceKeyRecipients(id, userId);
        if (recipients === null) {
            throwCustomError(1011);
        }
        if (recipients?.forbidden) {
            throwCustomError(1016);
        }

        await sendSuccess(req, res, "key recipients found", 200, recipients);
    } catch (error) {
        sendError(req, res, error);
    }
};

export const saveWorkspaceKeySharesHandler = async (req, res) => {
    try {
        const userId = req?.user?.id;
        const { id } = req.params;
        assertValidWorkspaceId(id);

        const schema = Joi.object({
            shares: Joi.array()
                .items(
                    Joi.object({
                        userId: Joi.string().required(),
                        encryptedWorkspaceKey: Joi.string().required(),
                    }),
                )
                .min(1)
                .required(),
        });
        const { error, value } = schema.validate(req.body);
        if (error) {
            throwCustomError(1006);
        }

        const recipients = await getWorkspaceKeyRecipients(id, userId);
        if (recipients === null) {
            throwCustomError(1011);
        }
        if (recipients?.forbidden) {
            throwCustomError(1016);
        }

        const eligibleIds = new Set(recipients.map((r) => r.userId));
        const invalidShare = value.shares.find(
            (share) => !eligibleIds.has(String(share.userId)),
        );
        if (invalidShare) {
            throwCustomError(1017);
        }

        const saved = await upsertWorkspaceKeyShares(id, userId, value.shares);
        if (!saved) {
            throwCustomError(1011);
        }
        if (saved?.forbidden) {
            throwCustomError(1016);
        }

        await sendSuccess(req, res, "workspace key shares saved", 200, {
            workspaceId: id,
            sharedWith: saved.length,
            shares: saved,
        });
    } catch (error) {
        sendError(req, res, error);
    }
};

export const getMyWorkSpaces = async (req, res) => {
    try {
        const userId = req?.user?.id;
        const email = await resolveUserEmail(req);
        const myWorkSpaces = await helper_getMyWorkSpaces(userId, email);
        await sendSuccess(req, res, "workspaces found", 200, myWorkSpaces);
    } catch (error) {
        sendError(req, res, error)
    }
}

export const createWorkSpace = async (req, res) => {
    try {
        const userId = req?.user?.id;
        const body = req.body;
        const newWorkSpace = await WorkSpace.create({
            name: body?.name,
            members: [userId],
            createdBy: userId,
            workspaceKey: body?.workspaceKey,
        })    
        await sendSuccess(req, res, "workspace created", 201, newWorkSpace)
    } catch (error) {
        sendError(req, res, error)
    }
}

export const deleteWorkSpace = async (req, res) => {
    try {
        const userId = req?.user?.id;
        const { id } = req.params;
        const deletedWorkSpace = await WorkSpace.findByIdAndDelete(id);
        await sendSuccess(req, res, "workspace deleted", 200, deletedWorkSpace);
    } catch (error) {
        sendError(req, res, error);
    }
};

export const updateWorkSpace = async (req, res) => {
    try {
        const userId = req?.user?.id;
        const { id } = req.params;
        const body = req.body;

        assertValidWorkspaceId(id);

        const workspace = await WorkSpace.findById(id);
        if (!workspace) {
            throwCustomError(1011);
        }
        if (String(workspace.createdBy) !== String(userId)) {
            throwCustomError(1016);
        }

        const existsingEmails = await MemberInvite.find({
            workspaceId: id,
            email: { $in: body?.members },
        });

      
        if(body?.members?.length){
            const memberInvites = body.members.map(member => {
                return {
                    workspaceId: id,
                    email: member,
                    invitedBy: userId,
                    inviteId: uuidv4()+Date.now()
                }
            })
            const newMemberInvites = memberInvites.filter(invite => !existsingEmails.some(existing => existing.email === invite.email));
            await MemberInvite.insertMany(newMemberInvites);   
            console.log(newMemberInvites)  ;
        } 
        // const updatedWorkSpace = await WorkSpace.findByIdAndUpdate(id, body, { new: true });
        await sendSuccess(req, res, "workspace updated", 200, {});
    } catch (error) {
        sendError(req, res, error);
    }
};

function assertValidWorkspaceId(id) {
    if (!Types.ObjectId.isValid(id)) {
        throwCustomError(1012);
    }
}

export const getWorkspaceKey = async (req, res) => {
    try {
        const userId = req?.user?.id;
        const { id } = req.params;
        assertValidWorkspaceId(id);

        const workspace = await WorkSpace.findOne({
            _id: new Types.ObjectId(id),
            members: new Types.ObjectId(userId),
        }).select("workspaceKey name createdBy");

        if (!workspace) {
            throwCustomError(1011);
        }

        const keyResult = await getEncryptedWorkspaceKeyForUser(id, userId);
        if (keyResult?.error === "no_workspace_key") {
            throwCustomError(1019);
        }
        if (keyResult?.error === "no_share") {
            throwCustomError(1018);
        }
        if (!keyResult || keyResult.error) {
            throwCustomError(1011);
        }

        await sendSuccess(req, res, "workspace key found", 200, {
            workspaceKey: keyResult.encryptedWorkspaceKey,
            encryptedWorkspaceKey: keyResult.encryptedWorkspaceKey,
            workspaceId: workspace._id,
            workspaceName: workspace.name,
            isOwner: keyResult.isOwner,
            keySource: keyResult.keySource,
        });
    } catch (error) {
        sendError(req, res, error);
    }
};

export const saveWorkspaceEncryptedPem = async (req, res) => {
    try {
        const userId = req?.user?.id;
        const { id } = req.params;

        const schema = Joi.object({
            encryptedPem: Joi.string().required(),
            fileName: Joi.string().optional(),
        });
        const { error, value } = schema.validate(req.body);
        if (error) {
            throwCustomError(1006);
        }

        const { encryptedPem, fileName } = value;
        assertValidWorkspaceId(id);

        const workspace = await WorkSpace.findOne({
            _id: new Types.ObjectId(id),
            members: new Types.ObjectId(userId),
        });

        if (!workspace) {
            throwCustomError(1011);
        }

        workspace.encryptedPem = encryptedPem.trim();
        workspace.encryptedPemFileName = fileName?.trim() || "key.pem";
        workspace.encryptedPemUploadedBy = new Types.ObjectId(userId);
        await workspace.save();

        await sendSuccess(req, res, "encrypted pem saved", 200, {
            workspaceId: workspace._id,
            encryptedPem: workspace.encryptedPem,
            fileName: workspace.encryptedPemFileName,
        });
    } catch (error) {
        sendError(req, res, error);
    }
};

export const getWorkSpaceById = async (req, res) => {
    try {
        const userId = req?.user?.id;
        const { id } = req.params;
        const pipeline = [
            {$match: {_id: new Types.ObjectId(id)}},
            {$match: {members: new Types.ObjectId(userId)}},
            {$lookup: {
                from: "shellix_member_invites",
                localField: "_id",
                foreignField: "workspaceId",
                as: "memberInvites"
            }}
        ];
        const workSpace = await WorkSpace.aggregate(pipeline);
        await sendSuccess(req, res, "workspace found", 200, workSpace);
    } catch (error) {
        sendError(req, res, error);
    }
};