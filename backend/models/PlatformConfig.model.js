import mongoose from 'mongoose';

const platformConfigSchema = new mongoose.Schema(
  {
    commissionRate: {
      type: Number,
      default: 10, // 10%
      min: [0, 'Commission rate cannot be negative'],
      max: [100, 'Commission rate cannot exceed 100'],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Singleton helper
platformConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({ commissionRate: 10 });
  }
  return config;
};

const PlatformConfig = mongoose.model('PlatformConfig', platformConfigSchema);

export default PlatformConfig;
