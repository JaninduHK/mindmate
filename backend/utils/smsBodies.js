// utils/smsBodies.js
/**
 * SMS message composition for crisis system
 * Keep messages short (<160 chars where possible for single SMS)
 */

/**
 * Compose invitation SMS
 */
export const composeInvitationSMS = (ownerName, invitationUrl) => {
  return {
    body: `You're invited to MindMate to get notified when ${ownerName} needs support. Create account: ${invitationUrl} Expires in 7 days.`,
    shortUrl: invitationUrl,
  };
};

/**
 * Compose emergency alert SMS (short version for SMS, can be split)
 */
export const composeEmergencyAlertSMS = (primaryUserName) => {
  return {
    body: `🚨 ALERT: ${primaryUserName} activated emergency mode on MindMate. Check if they need support. Visit dashboard for updates.`,
    shortUrl: 'https://mindmate.com/emergency-contacts/dashboard',
  };
};

/**
 * Compose emergency alert SMS with location
 */
export const composeEmergencyAlertSMSWithLocation = (primaryUserName, mapsUrl) => {
  return {
    body: `🚨 ALERT: ${primaryUserName} needs support. Location: ${mapsUrl}`,
    shortUrl: mapsUrl,
  };
};

/**
 * Compose inactivity alert SMS
 */
export const composeInactivityAlertSMS = (primaryUserName) => {
  return {
    body: `${primaryUserName} hasn't checked in to MindMate in 48+ hours. Please reach out to them.`,
  };
};

/**
 * Compose OTP SMS for emergency contact account verification
 */
export const composeOTPSMS = (otp) => {
  return {
    body: `Your MindMate emergency contact verification code is: ${otp}. Valid for 10 minutes.`,
  };
};

/**
 * Compose contact deleted SMS
 */
export const composeContactDeletedSMS = (primaryUserName) => {
  return {
    body: `${primaryUserName} removed you as an emergency contact on MindMate. You no longer have access to their guardian dashboard.`,
  };
};

/**
 * Truncate message to SMS length
 * Returns array of messages if it exceeds single SMS length
 */
export const truncateToSMSLength = (message, maxLength = 160) => {
  if (message.length <= maxLength) {
    return [message];
  }

  const messages = [];
  let remaining = message;

  while (remaining.length > maxLength) {
    // Try to cut at a word boundary
    let cutPoint = remaining.lastIndexOf(' ', maxLength);
    if (cutPoint === -1) cutPoint = maxLength;

    messages.push(remaining.substring(0, cutPoint).trim());
    remaining = remaining.substring(cutPoint).trim();
  }

  if (remaining.length > 0) {
    messages.push(remaining);
  }

  return messages;
};
