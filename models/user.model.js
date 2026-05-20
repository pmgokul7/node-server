import { Schema, model } from "mongoose";

const UserSchema = new Schema({
    email: { type: String, trim: true, lowercase: true, required: true },
    password: { type: String }, // optional for google login
}, { timestamps: true });

export const User = model("UserSchema", UserSchema, "shellix_users")

