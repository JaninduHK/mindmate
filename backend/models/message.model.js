import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    // File/Image support
    fileUrl: {
        type: String,
        default: null,
    },
    fileType: {
        type: String, // 'image', 'file', 'video', etc.
        default: null,
    },
    fileName: {
        type: String,
        default: null,
    },
    // Edit tracking
    isEdited: {
        type: Boolean,
        default: false,
    },
    editedAt: {
        type: Date,
        default: null,
    },
    // Soft delete
    deletedAt: {
        type: Date,
        default: null,
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId, // senderId or recipientId
        default: null,
    },
    // Read receipts
    readAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

// Index for faster message queries
messageSchema.index({ senderId: 1, recipientId: 1 });
messageSchema.index({ recipientId: 1, senderId: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ message: 'text' }); // Text index for search

export default mongoose.model("Message", messageSchema);