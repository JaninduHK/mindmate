import mongoose from 'mongoose';

const peerSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    peerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    topic: { type: String, required: true, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    cancellationReason: { type: String, default: '' },
  },
  { timestamps: true }
);

peerSessionSchema.index({ userId: 1, status: 1 });
peerSessionSchema.index({ peerId: 1, status: 1 });

export default mongoose.model('PeerSession', peerSessionSchema);
