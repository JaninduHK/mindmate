import Notification from '../models/Notification.model.js';
import User from '../models/User.model.js';
import { sendEmail } from '../utils/email.util.js';

/**
 * Creates an in-app notification and sends an email.
 * @param {Object} opts - { userId, type, title, message, data }
 */
export const sendNotification = async ({ userId, type, title, message, data = {} }) => {
  try {
    // 1. Persist in-app notification
    await Notification.create({ userId, type, title, message, data });

    // 2. Send email (non-blocking — errors are swallowed in sendEmail)
    const user = await User.findById(userId).select('email name');
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: title,
        html: `<p>Hi ${user.name},</p><p>${message}</p><p>— The MindMate Team</p>`,
        text: `Hi ${user.name},\n\n${message}\n\n— The MindMate Team`,
      });
    }
  } catch (error) {
    // Notification failure must never break the parent request
    console.error('Notification service error:', error.message);
  }
};
