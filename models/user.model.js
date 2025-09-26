import { Schema, model } from "mongoose";

const UserSchema = new Schema({
    username: { type: String, trim: true, required: true },
    email: { type: String, trim: true, lowercase: true, required: true },
    password: { type: String }, // optional for google login
    origin: {
        type: String,
        enum: ['google', 'normal'],
        default: 'normal',
        required: true
    },
    image_url: {
        type: String,
        trim: true,
        default: 'https://example.com/default-profile.png' // default profile pic
    }
}, { timestamps: true });

export const User = model("UserSchema", UserSchema, "users")

