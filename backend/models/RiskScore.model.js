// models/RiskScore.model.js
import mongoose from 'mongoose';

const riskScoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    level: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
      index: true,
    },
    factors: {
      moodTrend: String,          // "declining", "improving", "stable"
      inactivityHours: Number,
      recentMoodEntries: Number,
      goalProgress: String,       // "on_track", "off_track", "not_started"
      lastEmergencyActivation: Date,
      customRiskFactors: [String],
    },
    source: {
      type: String,
      enum: ['automated', 'manual', 'assessment'],
      default: 'automated',
    },
    assessmentData: mongoose.Schema.Types.Mixed,
    notedAt: {
      type: Date,
      default: () => new Date(),
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
riskScoreSchema.index({ userId: 1, createdAt: -1 });
riskScoreSchema.index({ userId: 1, level: 1 });
riskScoreSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete

const RiskScore = mongoose.model('RiskScore', riskScoreSchema);

export default RiskScore;
