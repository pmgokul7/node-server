import { Schema, model } from "mongoose";

const UserKeysSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "UserSchema", required: true, unique: true },
    publicKey: { type: String, required: true },
    encryptedPrivateKey: { type: String, required: true },
    personalWorkspaceKey: { type: String },
    authTag: { type: String },
    salt: { type: String },
    iv: { type: String },
}, { timestamps: true });

const UserKeys = model("UserKeysSchema", UserKeysSchema, "shellix_user_keys");

export default UserKeys;
