import mongoose from 'mongoose';

const peerSupporterProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    isVerified: {
      type: Boolean,
      default: false, // Requires admin approval
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const PeerSupporterProfile = mongoose.model('PeerSupporterProfile', peerSupporterProfileSchema);

export default PeerSupporterProfile;
