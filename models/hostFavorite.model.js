import { Schema, model } from "mongoose";

const HostFavoriteSchema = new Schema(
    {
        hostId: { type: Schema.Types.ObjectId, ref: "HostSchema", required: true },
        userId: { type: Schema.Types.ObjectId, ref: "UserSchema", required: true },
    },
    { timestamps: true },
);

HostFavoriteSchema.index({ hostId: 1, userId: 1 }, { unique: true });

const HostFavorite = model(
    "HostFavoriteSchema",
    HostFavoriteSchema,
    "shellix_host_favorites",
);

export default HostFavorite;
