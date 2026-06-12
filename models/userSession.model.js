import { Schema, model } from "mongoose";

const PLATFORMS = ["windows", "macos", "linux", "web"];

const UserSessionSchema = new Schema(
    {
        sessionId: { type: String, required: true, unique: true, index: true },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "UserSchema",
            required: true,
            index: true,
        },
        signedInAt: { type: Date, required: true, default: Date.now },
        signedOutAt: { type: Date, default: null },
        ipAddress: { type: String, default: null },
        platform: { type: String, enum: PLATFORMS, required: true },
    },
    { timestamps: true },
);

UserSessionSchema.index({ userId: 1, signedInAt: -1 });

const UserSession = model("UserSessionSchema", UserSessionSchema, "shellix_user_sessions");

export default UserSession;
export { PLATFORMS };
