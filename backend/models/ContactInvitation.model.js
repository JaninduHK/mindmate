// models/ContactInvitation.model.js
import mongoose from 'mongoose';

const contactInvitationSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    emergencyContactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmergencyContact',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // Auto-delete after expiry
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired', 'revoked'],
      default: 'pending',
      index: true,
    },
    channelsAttempted: {
      email: {
        type: Boolean,
        default: false,
      },
      sms: {
        type: Boolean,
        default: false,
      },
    },
    deliveryResult: {
      email: {
        success: { type: Boolean, default: false },
        error: String,
        attemptedAt: Date,
      },
      sms: {
        success: { type: Boolean, default: false },
        error: String,
        attemptedAt: Date,
      },
    },
    failureReason: String,
  },
  {
    timestamps: true,
  }
);

// Index for finding active invitations
contactInvitationSchema.index({ ownerUserId: 1, status: 1 });
contactInvitationSchema.index({ emergencyContactId: 1 });

const ContactInvitation = mongoose.model('ContactInvitation', contactInvitationSchema);

export default ContactInvitation;
