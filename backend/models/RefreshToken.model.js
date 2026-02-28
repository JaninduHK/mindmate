import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    createdByIp: {
      type: String,
    },
    revokedAt: {
      type: Date,
    },
    revokedByIp: {
      type: String,
    },
    replacedByToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries (token is already indexed via unique: true)
refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

// Method to check if token is expired
refreshTokenSchema.methods.isExpired = function () {
  return Date.now() >= this.expiresAt.getTime();
};

// Method to check if token is active
refreshTokenSchema.methods.isActive = function () {
  return !this.revokedAt && !this.isExpired();
};

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;
