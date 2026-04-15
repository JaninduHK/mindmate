// models/ContentResource.model.js
import mongoose from 'mongoose';
import { CONTENT_TYPE, CONTENT_RISK_LEVEL } from '../config/crisis.config.js';

const contentResourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(CONTENT_TYPE),
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    thumbnailUrl: String,
    externalUrl: {
      type: String,
      required: true,
    },
    sourceDomain: String,
    durationText: String, // e.g., "5 minutes", "2:34"
    riskLevel: {
      type: String,
      enum: Object.values(CONTENT_RISK_LEVEL),
      default: 'low',
      index: true,
    },
    // Moods this content is appropriate for (from mood tracking system)
    moods: [String],
    // Goals this content supports
    goals: [String],
    // Search/filter tags
    tags: [String],
    isCurated: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    ratingSum: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for recommendations
contentResourceSchema.index({ type: 1, isActive: 1 });
contentResourceSchema.index({ riskLevel: 1, isActive: 1 });
contentResourceSchema.index({ moods: 1, isActive: 1 });
contentResourceSchema.index({ goals: 1, isActive: 1 });
contentResourceSchema.index({ isCurated: 1, isActive: 1 });

const ContentResource = mongoose.model('ContentResource', contentResourceSchema);

export default ContentResource;
