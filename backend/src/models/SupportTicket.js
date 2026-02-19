import mongoose from "mongoose";

const SupportTicketSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        subject: { type: String, required: true, trim: true, maxlength: 150 },
        category: {
            type: String,
            enum: ["order", "payment", "prescription", "medicine", "other"],
            required: true,
        },
        message: { type: String, required: true, trim: true, maxlength: 2000 },
        status: {
            type: String,
            enum: ["open", "in-progress", "resolved"],
            default: "open",
        },
        adminReply: { type: String, trim: true, maxlength: 2000 },
        repliedAt: { type: Date },
    },
    { timestamps: true }
);

SupportTicketSchema.index({ user: 1 });
SupportTicketSchema.index({ status: 1 });

export default mongoose.model("SupportTicket", SupportTicketSchema);
