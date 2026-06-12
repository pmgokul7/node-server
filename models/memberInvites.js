import { Schema, model } from "mongoose";

const MemberInviteSchema = new Schema({
    email: { type: String, trim: true, lowercase: true, required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'WorkSpaceSchema', required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'UserSchema', required: true },
    emailSent: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    inviteId: { type: String, required: true }
}, { timestamps: true });

const MemberInvite = model("MemberInviteSchema", MemberInviteSchema, "shellix_member_invites")

export default MemberInvite;