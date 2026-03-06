import mongoose, { mongo } from "mongoose";

const mesageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    message: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

export default mongoose.model("Message", mesageSchema);