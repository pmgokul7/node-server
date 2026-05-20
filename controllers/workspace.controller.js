import { sendError, sendSuccess } from "../helper/requestHandler.js";
import WorkSpace from "../models/workSpaces.model.js";
import { helper_getMyWorkSpaces } from "../services/workspace.service.js";
import MemberInvite from "../models/memberInvites.js";

export const getMyWorkSpaces = async (req, res) => {
    try {
        const userId = req?.user?.id;
        const myWorkSpaces = await helper_getMyWorkSpaces(userId)    
        await sendSuccess(req, res, "user created", 201, myWorkSpaces)
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
            createdBy: userId
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
        if(body?.members?.length){
            const memberInvites = body.members.map(member => {
                return {
                    workspaceId: id,
                    email: member,
                    invitedBy: userId
                }
            })
            await MemberInvite.insertMany(memberInvites);     
        } 
        // const updatedWorkSpace = await WorkSpace.findByIdAndUpdate(id, body, { new: true });
        await sendSuccess(req, res, "workspace updated", 200, updatedWorkSpace);
    } catch (error) {
        sendError(req, res, error);
    }
};