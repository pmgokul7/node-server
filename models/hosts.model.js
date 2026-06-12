import { Schema, model } from "mongoose";

const HostSchema = new Schema(
    {
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "WorkSpaceSchema",
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "UserSchema",
            required: true,
        },
        name: { type: String, required: true, trim: true },
        address: { type: String, required: true, trim: true },
        port: { type: Number, default: 22 },
        username: { type: String, required: true, trim: true },
        authType: { type: String, enum: ["pem", "password"], default: "pem" },
        encryptedPem: { type: String },
        pemFileName: { type: String },
    },
    { timestamps: true },
);

const Host = model("HostSchema", HostSchema, "shellix_hosts");

export default Host;
