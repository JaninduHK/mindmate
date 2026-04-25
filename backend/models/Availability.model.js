import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema(
  {
    supporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String, // Format: "HH:MM" (24-hour)
      required: true,
    },
    endTime: {
      type: String, // Format: "HH:MM" (24-hour)
      required: true,
    },
    slotDuration: {
      type: Number, // Duration of each slot in minutes (30, 60, etc.)
      default: 60,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Compound index for efficient queries
availabilitySchema.index({ supporterId: 1, date: 1 });

const Availability = mongoose.model('Availability', availabilitySchema);
export default Availability;
