// services/invitationService.js
import crypto from 'crypto';
import EmergencyContact from '../models/EmergencyContact.model.js';
import ContactInvitation from '../models/ContactInvitation.model.js';
import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../config/constants.js';
import { CRISIS_CONFIG, INVITATION_STATUS } from '../config/crisis.config.js';
import { generateInvitationToken, hashToken, verifyTokenHash } from '../utils/tokenGenerator.js';
import { normalizePhoneNumber } from '../utils/phoneNormalizer.js';

class InvitationService {
  /**
   * Create invitation token and record
   */
  async createInvitation(ownerUserId, emergencyContactId, contactEmail) {
    try {
      const rawToken = generateInvitationToken();
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + CRISIS_CONFIG.INVITATION.EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      const invitation = await ContactInvitation.create({
        ownerUserId,
        emergencyContactId,
        tokenHash,
        expiresAt,
        status: 'pending',
      });

      return {
        token: rawToken,
        invitation,
        expiresAt,
      };
    } catch (error) {
      throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, `Failed to create invitation: ${error.message}`);
    }
  }

  /**
   * Validate invitation token
   * Returns token validity status and invitation data
   */
  async validateToken(token) {
    try {
      // Find all pending invitations for this user (we'll validate against hash)
      const invitations = await ContactInvitation.find({
        status: INVITATION_STATUS.PENDING,
      }).select('+tokenHash');

      let validInvitation = null;

      for (const inv of invitations) {
        if (verifyTokenHash(token, inv.tokenHash)) {
          validInvitation = inv;
          break;
        }
      }

      if (!validInvitation) {
        return {
          isValid: false,
          reason: 'Invalid token',
        };
      }

      // Check expiry
      if (new Date() > validInvitation.expiresAt) {
        await ContactInvitation.updateOne(
          { _id: validInvitation._id },
          { status: INVITATION_STATUS.EXPIRED }
        );
        return {
          isValid: false,
          reason: 'Token has expired',
        };
      }

      // Fetch related data
      const emergencyContact = await EmergencyContact.findById(validInvitation.emergencyContactId);
      const ownerUser = await User.findById(validInvitation.ownerUserId).select('name email');

      return {
        isValid: true,
        invitation: validInvitation,
        emergencyContact,
        ownerUser,
        expiresAt: validInvitation.expiresAt,
      };
    } catch (error) {
      throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, `Token validation failed: ${error.message}`);
    }
  }

  /**
   * Accept invitation and create new emergency_contact account
   */
  async acceptInvitationNewAccount(token, contactData) {
    const validation = await this.validateToken(token);
    if (!validation.isValid) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, validation.reason);
    }

    const session = await EmergencyContact.startSession();
    session.startTransaction();

    try {
      const { fullName, email, password, phoneNumber } = contactData;
      const ownerUserId = validation.invitation.ownerUserId;

      // Check if email already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        throw new ApiError(HTTP_STATUS.CONFLICT, 'Email already registered');
      }

      // Create new user with emergency_contact role
      const newUser = await User.create(
        [
          {
            name: fullName,
            email: email.toLowerCase(),
            password,
            phoneNumber: phoneNumber ? normalizePhoneNumber(phoneNumber) : null,
            role: 'emergency_contact',
            linkedUsers: [ownerUserId],
            isEmailVerified: true, // Since they invited themselves via email
          },
        ],
        { session }
      );

      // Update emergency contact record
      await EmergencyContact.findByIdAndUpdate(
        validation.invitation.emergencyContactId,
        {
          contactUserId: newUser[0]._id,
          inviteStatus: INVITATION_STATUS.ACCEPTED,
        },
        { session }
      );

      // Update invitation record
      await ContactInvitation.findByIdAndUpdate(
        validation.invitation._id,
        {
          status: INVITATION_STATUS.ACCEPTED,
          acceptedAt: new Date(),
        },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return {
        user: newUser[0],
        message: 'Account created and invitation accepted',
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      if (error instanceof ApiError) throw error;
      throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, `Failed to accept invitation: ${error.message}`);
    }
  }

  /**
   * Accept invitation with existing account
   */
  async acceptInvitationExistingAccount(token, userId) {
    const validation = await this.validateToken(token);
    if (!validation.isValid) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, validation.reason);
    }

    const session = await User.startSession();
    session.startTransaction();

    try {
      const existingUser = await User.findById(userId).session(session);
      if (!existingUser) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
      }

      // Check if user is already linked to this owner
      const ownerUserId = validation.invitation.ownerUserId;
      if (existingUser.linkedUsers.includes(ownerUserId)) {
        throw new ApiError(HTTP_STATUS.CONFLICT, 'Already linked to this user');
      }

      // Add owner to linkedUsers
      existingUser.linkedUsers.push(ownerUserId);
      existingUser.role = 'emergency_contact'; // Ensure role is set
      await existingUser.save({ session });

      // Update emergency contact
      await EmergencyContact.findByIdAndUpdate(
        validation.invitation.emergencyContactId,
        {
          contactUserId: existingUser._id,
          inviteStatus: INVITATION_STATUS.ACCEPTED,
        },
        { session }
      );

      // Update invitation
      await ContactInvitation.findByIdAndUpdate(
        validation.invitation._id,
        {
          status: INVITATION_STATUS.ACCEPTED,
          acceptedAt: new Date(),
        },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return {
        user: existingUser,
        message: 'Invitation accepted and account linked',
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      if (error instanceof ApiError) throw error;
      throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, `Failed to accept invitation: ${error.message}`);
    }
  }

  /**
   * Revoke an invitation
   */
  async revokeInvitation(invitationId) {
    try {
      const invitation = await ContactInvitation.findByIdAndUpdate(
        invitationId,
        {
          status: INVITATION_STATUS.REVOKED,
          revokedAt: new Date(),
        },
        { new: true }
      );

      if (!invitation) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Invitation not found');
      }

      // Also update emergency contact status
      await EmergencyContact.findByIdAndUpdate(
        invitation.emergencyContactId,
        { inviteStatus: INVITATION_STATUS.REVOKED }
      );

      return invitation;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, `Failed to revoke invitation: ${error.message}`);
    }
  }

  /**
   * Cleanup expired invitations (called by scheduled job)
   */
  async cleanupExpiredInvitations() {
    try {
      const result = await ContactInvitation.updateMany(
        {
          status: INVITATION_STATUS.PENDING,
          expiresAt: { $lt: new Date() },
        },
        {
          status: INVITATION_STATUS.EXPIRED,
        }
      );

      // Also mark emergency contacts as expired
      await EmergencyContact.updateMany(
        {
          inviteStatus: INVITATION_STATUS.PENDING,
          inviteExpiresAt: { $lt: new Date() },
        },
        {
          inviteStatus: INVITATION_STATUS.EXPIRED,
        }
      );

      return {
        modifiedCount: result.modifiedCount,
        message: `Cleaned up ${result.modifiedCount} expired invitations`,
      };
    } catch (error) {
      console.error('Error cleaning up expired invitations:', error);
    }
  }
}

export default new InvitationService();
