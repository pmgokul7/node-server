import { Schema,model } from "mongoose";

const WorkSpaceSchema = new Schema({
    name: { type: String, required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'UserSchema' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'UserSchema', required: true },
    workspaceKey: { type: String },
    encryptedPem: { type: String },
    encryptedPemFileName: { type: String },
    encryptedPemUploadedBy: { type: Schema.Types.ObjectId, ref: "UserSchema" },
}, { timestamps: true });

const WorkSpace = model("WorkSpaceSchema", WorkSpaceSchema, "shellix_workspaces")

export default WorkSpace;