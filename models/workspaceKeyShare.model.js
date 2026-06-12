import { Schema, model } from "mongoose";

const WorkspaceKeyShareSchema = new Schema(
    {
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "WorkSpaceSchema",
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "UserSchema",
            required: true,
        },
        encryptedWorkspaceKey: { type: String, required: true },
    },
    { timestamps: true },
);

WorkspaceKeyShareSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

const WorkspaceKeyShare = model(
    "WorkspaceKeyShareSchema",
    WorkspaceKeyShareSchema,
    "shellix_workspace_key_shares",
);

export default WorkspaceKeyShare;
