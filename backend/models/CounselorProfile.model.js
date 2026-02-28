import mongoose from 'mongoose';

const counselorProfileSchema = new mongoose.Schema(
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
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
    },
    specializations: {
      type: [String],
      default: [],
    },
    certifications: [
      {
        name: { type: String, required: true },
        issuingBody: { type: String, required: true },
        fileUrl: { type: String },
        issuedAt: { type: Date },
      },
    ],
    languages: {
      type: [String],
      default: ['English'],
    },
    stripeAccountId: {
      type: String,
      sparse: true,
    },
    isVerified: {
      type: Boolean,
      default: true, // Auto-verified on submission
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
  },
  { timestamps: true }
);

const CounselorProfile = mongoose.model('CounselorProfile', counselorProfileSchema);

export default CounselorProfile;
