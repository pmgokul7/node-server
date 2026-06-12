import { sendError, sendSuccess } from "../helper/requestHandler.js";
import { throwCustomError } from "../helper/error.js";
import MemberInvite from "../models/memberInvites.js";
import WorkSpace from "../models/workSpaces.model.js";
import { User } from "../models/user.model.js";
import { Types } from "mongoose";

export const acceptMemberInvite = async (req, res) => {
    try {
        const { inviteId } = req.params;
        const userId = req?.user?.id;

        if (inviteId.length < 36) {
            console.log("inviteId length is less than 36");
            throwCustomError(1010);
        }

        const user = await User.findById(userId);
        if (!user) {
            console.log("user not found");
            throwCustomError(1010);
        }

        const invite = await MemberInvite.findOne({ inviteId });
        if (!invite) {
            console.log("invite not found");
            throwCustomError(1010);
        }

        if (invite.status !== "pending") {
            console.log("invite status is not pending");
            throwCustomError(1010);
        }

        const inviteEmail = invite.email?.trim().toLowerCase();
        const userEmail = user.email?.trim().toLowerCase();
        // if (!inviteEmail || inviteEmail !== userEmail) {
        //     throwCustomError(1015);
        // }

        const workspace = await WorkSpace.findByIdAndUpdate(
            invite.workspaceId,
            { $addToSet: { members: user._id } },
            { new: true },
        );

        if (!workspace) {
            console.log("workspace not found");
            throwCustomError(1010);
        }

        invite.status = "accepted";
        await invite.save();

        await sendSuccess(req, res, "invite accepted", 200, {
            workspaceId: invite.workspaceId,
            workspaceName: workspace.name,
        });
    } catch (error) {
        sendError(req, res, error);
    }
};
