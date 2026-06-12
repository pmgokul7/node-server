import { Schema, model } from "mongoose";

const ActivityLogSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "UserSchema",
            default: null,
            index: true,
        },
        action: { type: String, required: true, index: true },
        entityType: { type: String, default: null, index: true },
        entityId: { type: String, default: null, index: true },
        summary: { type: String, default: null },
        metadata: { type: Schema.Types.Mixed, default: {} },
        ipAddress: { type: String, default: null },
        platform: { type: String, default: null },
        method: { type: String, required: true },
        path: { type: String, required: true },
        statusCode: { type: Number, required: true },
        success: { type: Boolean, required: true, default: false },
    },
    { timestamps: true },
);

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ userId: 1, createdAt: -1 });

const ActivityLog = model(
    "ActivityLogSchema",
    ActivityLogSchema,
    "activity_logs",
);

export default ActivityLog;
