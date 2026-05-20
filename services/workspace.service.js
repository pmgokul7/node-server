import WorkSpace from "../models/workSpaces.model.js";

export const helper_getMyWorkSpaces = async (userId) => {
//   
    const pipeline = [
        {
            $match:{
                members: { $in: [userId] }
            }
        },
        {
            $lookup: {
                from: "shellix_members_invites",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdByDetails"
            }
        }

    ]

    const workSpaces = await WorkSpace.aggregate(pipeline);
    return workSpaces;
}