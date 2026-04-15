import User from '../models/User.model.js';
import RefreshToken from '../models/RefreshToken.model.js';
import EmergencyContact from '../models/EmergencyContact.model.js';
import { cloudinary } from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HTTP_STATUS } from '../config/constants.js';
import { sendEmail } from '../utils/email.util.js';

// Get all regular users (for peer supporters to help)
export const getUsers = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({ role: 'user', isActive: true })
        .select('name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments({ role: 'user', isActive: true }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
});

// Get user profile
export const getProfile = asyncHandler(async (req, res) => {
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { user: req.user.toPublicJSON() }, 'Profile retrieved successfully')
  );
});

// Update user profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  // Check if email is being changed and if it's already taken
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Email already in use');
    }
    user.email = email;
  }

  if (name) {
    user.name = name;
  }

  await user.save();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { user: user.toPublicJSON() }, 'Profile updated successfully')
  );
});

// Change password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);

  if (!isPasswordValid) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Revoke all refresh tokens for security
  await RefreshToken.updateMany(
    { userId: user._id, revokedAt: null },
    { revokedAt: new Date(), revokedByIp: req.ip }
  );

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, null, 'Password changed successfully. Please login again.')
  );
});

// Delete account
export const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  // Delete avatar from Cloudinary if exists
  if (user.avatar.publicId) {
    try {
      await cloudinary.uploader.destroy(user.avatar.publicId);
    } catch (error) {
      console.error('Error deleting avatar from Cloudinary:', error);
    }
  }

  // Delete all refresh tokens
  await RefreshToken.deleteMany({ userId: user._id });

  // Delete user
  await user.deleteOne();

  // Clear cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, null, 'Account deleted successfully')
  );
});

// Toggle availability status for peer counselors
export const toggleAvailabilityNow = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  if (user.role !== 'peer_supporter') {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Only peer supporters can toggle availability');
  }

  // Toggle availability
  user.isAvailableNow = !user.isAvailableNow;
  user.lastAvailableToggle = new Date();
  await user.save();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        isAvailableNow: user.isAvailableNow,
        message: user.isAvailableNow ? 'You are now available' : 'You are now unavailable'
      },
      user.isAvailableNow ? 'Status updated to available' : 'Status updated to unavailable'
    )
  );
});

// Get peer counselor availability status
export const getAvailabilityStatus = asyncHandler(async (req, res) => {
  const { peerId } = req.params;

  const peer = await User.findById(peerId).select('isAvailableNow name email avatar role');

  if (!peer || peer.role !== 'peer_supporter') {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Peer counselor not found');
  }

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, {
      peerId: peer._id,
      name: peer.name,
      email: peer.email,
      avatar: peer.avatar,
      isAvailableNow: peer.isAvailableNow,
    })
  );
});

// Activate emergency mode for the user
export const activateEmergency = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { location } = req.body;

  // Update user emergency status
  const user = await User.findByIdAndUpdate(
    userId,
    {
      emergencyMode: true,
      emergencyActivatedAt: new Date(),
      emergencyLocation: location ? {
        coordinates: [location.lng, location.lat],
        type: 'Point'
      } : null,
    },
    { new: true }
  ).select('-password -refreshToken');

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  // Fetch emergency contacts from database (only accepted ones)
  const emergencyContacts = await EmergencyContact.find({
    ownerUserId: userId,
    inviteStatus: 'accepted'
  });

  console.log(`Activating emergency for user ${userId}. Found ${emergencyContacts.length} emergency contacts.`);

  // Send notifications to emergency contacts
  if (emergencyContacts && emergencyContacts.length > 0) {
    try {
      // Send emails in parallel
      const notifications = emergencyContacts.map(async (contact) => {
        // Send Email notification
        if (contact.email) {
          const emailSubject = `🚨 EMERGENCY ALERT: ${user.name} Needs Help`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 24px;">🚨 EMERGENCY ALERT 🚨</h1>
              </div>
              
              <div style="margin-bottom: 20px;">
                <h2 style="color: #dc2626;">Emergency Mode Activated</h2>
                <p style="font-size: 16px; line-height: 1.6;">
                  <strong>${user.name}</strong> has activated emergency mode and may need your immediate assistance.
                </p>
              </div>

              <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin-bottom: 20px;">
                <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                ${location ? `<p style="margin: 5px 0;"><strong>Location Shared:</strong> Yes</p>` : ''}
                <p style="margin: 5px 0;"><strong>Contact Email:</strong> ${user.email}</p>
              </div>

              <div style="margin-bottom: 20px;">
                <h3 style="color: #dc2626;">Action Required:</h3>
                <ul style="line-height: 1.8;">
                  <li>Attempt to contact ${user.name} immediately</li>
                  <li>Check their location if available</li>
                  <li>Contact other emergency contacts if needed</li>
                  <li>Call emergency services (911) if the situation is life-threatening</li>
                </ul>
              </div>

              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 12px; color: #666;">
                <p style="margin: 0;">This is an automated emergency notification from MindMate.</p>
              </div>
            </div>
          `;
          
          try {
            await sendEmail({
              to: contact.email,
              subject: emailSubject,
              html: emailHtml
            });
            console.log(`Emergency email sent to ${contact.email}`);
          } catch (error) {
            console.error(`Failed to send email to ${contact.email}:`, error);
          }
        }
      });

      // Wait for all notifications to complete
      await Promise.allSettled(notifications);
    } catch (error) {
      // Log error but don't fail the emergency activation
      console.error('Error sending emergency notifications:', error);
    }
  }

  // Also send confirmation email to the user themselves
  if (user.email) {
    try {
      const userEmailSubject = '✅ Emergency Mode Activated';
      const userEmailHtml = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px;">✅ Emergency Mode Activated</h1>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p style="font-size: 16px; line-height: 1.6;">
              Your emergency mode has been successfully activated.
            </p>
            <ul style="line-height: 1.8;">
              <li>✅ ${emergencyContacts.length} emergency contact(s) have been notified</li>
              <li>✅ Your location has been shared (if available)</li>
              <li>📧 Email notifications sent to all contacts</li>
              ${emergencyContacts.filter(c => c.phoneNumber).length > 0 ? '<li>📱 SMS messages sent to contacts with phone numbers</li>' : ''}
            </ul>
          </div>

          <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0;"><strong>Your emergency contacts will be monitoring the situation.</strong></p>
          </div>

          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 12px; color: #666;">
            <p style="margin: 0;">You can deactivate emergency mode anytime through your dashboard or the emergency banner.</p>
          </div>
        </div>
      `;
      
      await sendEmail({
        to: user.email,
        subject: userEmailSubject,
        html: userEmailHtml
      });
    } catch (error) {
      console.error('Failed to send confirmation email to user:', error);
    }
  }

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { user, notifiedContacts: emergencyContacts.length }, 'Emergency mode activated successfully')
  );
});

// Deactivate emergency mode for the user
export const deactivateEmergency = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findByIdAndUpdate(
    userId,
    {
      emergencyMode: false,
      emergencyDeactivatedAt: new Date(),
    },
    { new: true }
  ).select('-password -refreshToken');

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  // Notify emergency contacts that the emergency has been deactivated
  try {
    const emergencyContacts = await EmergencyContact.find({
      ownerUserId: userId,
      inviteStatus: 'accepted',
    }).select('fullName email phoneNumber');

    if (emergencyContacts && emergencyContacts.length > 0) {
      // Send deactivation emails to all contacts
      const notifications = emergencyContacts.map(async (contact) => {
        if (contact.email) {
          const emailSubject = `✅ Emergency Deactivated: ${user.name} is safe`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 24px;">✅ Emergency Deactivated</h1>
              </div>
              
              <div style="margin-bottom: 20px;">
                <p style="font-size: 16px; line-height: 1.6;">
                  <strong>${user.name}</strong>'s emergency mode has been deactivated at ${new Date().toLocaleString()}.
                </p>
                <p style="color: #10b981; font-weight: bold;">They are safe and the emergency situation has concluded.</p>
              </div>

              <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px;">
                <p style="margin: 0;">You can stop monitoring and resume normal contact with them.</p>
              </div>
            </div>
          `;
          
          try {
            await sendEmail({
              to: contact.email,
              subject: emailSubject,
              html: emailHtml
            });
          } catch (error) {
            console.error(`Failed to send deactivation email to ${contact.email}:`, error);
          }
        }
      });

      await Promise.allSettled(notifications);
    }
  } catch (error) {
    console.error('Error sending deactivation notifications:', error);
  }

  // Send confirmation email to the user
  if (user.email) {
    try {
      const emailSubject = '✅ Emergency Mode Deactivated';
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px;">✅ Emergency Mode Deactivated</h1>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p style="font-size: 16px; line-height: 1.6;">
              Your emergency mode has been successfully deactivated at ${new Date().toLocaleString()}.
            </p>
            <p style="color: #10b981; font-weight: bold;">Your emergency contacts have been notified that you are safe.</p>
          </div>

          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 12px; color: #666;">
            <p style="margin: 0;">If you need help in the future, you can activate emergency mode again from your dashboard.</p>
          </div>
        </div>
      `;
      
      await sendEmail({
        to: user.email,
        subject: emailSubject,
        html: emailHtml
      });
    } catch (error) {
      console.error('Failed to send deactivation confirmation email to user:', error);
    }
  }

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { user }, 'Emergency mode deactivated successfully')
  );
});

// Get emergency status
export const getEmergencyStatus = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId).select('emergencyMode emergencyActivatedAt emergencyLocation');

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, {
      emergencyMode: user.emergencyMode,
      activatedAt: user.emergencyActivatedAt,
      location: user.emergencyLocation,
    }, 'Emergency status retrieved successfully')
  );
});
