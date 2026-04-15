// utils/invitationMailer.js
/**
 * Email composition utilities for crisis system
 */

/**
 * Compose invitation email with link
 */
export const composeInvitationEmail = (contactName, ownerName, invitationUrl, relationship) => {
  return {
    subject: `${ownerName} has invited you to be their emergency contact on MindMate`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Emergency Contact Invitation</h2>
        
        <p>Hi ${contactName},</p>
        
        <p>You have been invited to the <strong>MindMate</strong> website to create an account to get notified when <strong>${ownerName}</strong> needs support.</p>
        
        <p><strong>${ownerName}</strong> has added you as their emergency contact (${relationship}) on MindMate, a wellness platform that helps people manage their mental health.</p>
        
        <p>As their emergency contact, you will be able to:</p>
        <ul>
          <li>Receive notifications if they need help</li>
          <li>Access a guardian dashboard to check on their wellbeing</li>
          <li>Be contacted if they activate emergency mode</li>
        </ul>
        
        <p style="margin-top: 30px;">
          <a href="${invitationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Create Account & Accept Invitation
          </a>
        </p>
        
        <p style="font-size: 12px;"><em>This invitation will expire in 7 days. If you don't wish to accept, you can ignore this email.</em></p>
        
        <hr style="margin-top: 40px; border: none; border-top: 1px solid #ccc;">
        <p style="font-size: 12px; color: #666;">
          MindMate Support | <a href="https://mindmate.com" style="color: #2563eb;">mindmate.com</a>
        </p>
      </div>
    `,
    text: `
Emergency Contact Invitation

Hi ${contactName},

You have been invited to the MindMate website to create an account to get notified when ${ownerName} needs support.

${ownerName} has added you as their emergency contact (${relationship}).

Click here to create your account and accept the invitation: ${invitationUrl}

This invitation will expire in 7 days.

Best regards,
MindMate Support
    `.trim(),
  };
};

/**
 * Compose emergency activation email
 */
export const composeEmergencyAlertEmail = (primaryUserName, mapsUrl = null, emergencyNumber) => {
  let locationHtml = '';
  if (mapsUrl) {
    locationHtml = `
      <p>
        <strong>Location:</strong> <a href="${mapsUrl}">View on Map</a>
      </p>
    `;
  }

  return {
    subject: `🚨 Emergency Alert: ${primaryUserName} needs support`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">⚠️ Emergency Alert</h2>
        
        <p><strong>${primaryUserName}</strong> has activated emergency mode on MindMate.</p>
        
        <p style="margin: 20px 0;">
          <strong>What this means:</strong> They may need support. Please check on them right away.
        </p>
        
        ${locationHtml}
        
        <p>
          <strong>Emergency Services:</strong> <a href="tel:${emergencyNumber}">${emergencyNumber}</a><br>
          <em>Call immediately if there is imminent danger</em>
        </p>
        
        <p style="margin-top: 30px;">
          <a href="https://mindmate.com/emergency-contacts/dashboard" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            View Guardian Dashboard
          </a>
        </p>
        
        <hr style="margin-top: 40px; border: none; border-top: 1px solid #ccc;">
        <p style="font-size: 12px; color: #666;">
          MindMate Emergency Alert | <a href="https://mindmate.com" style="color: #dc2626;">mindmate.com</a>
        </p>
      </div>
    `,
    text: `
EMERGENCY ALERT: ${primaryUserName} needs support

${primaryUserName} has activated emergency mode on MindMate.

${mapsUrl ? `View location: ${mapsUrl}` : ''}

Emergency Services: ${emergencyNumber}
Call immediately if there is imminent danger.

View Dashboard: https://mindmate.com/emergency-contacts/dashboard

MindMate Emergency Support
    `.trim(),
  };
};

/**
 * Compose contact updated notification email
 */
export const composeContactUpdatedEmail = (ownerName, message) => {
  return {
    subject: `Update: ${ownerName} modified emergency contact information`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Emergency Contact Update</h2>
        
        <p>${ownerName} has updated their emergency contact information on MindMate.</p>
        
        <p>${message}</p>
        
        <p><em>If you believe this email was sent to you in error, please contact MindMate support.</em></p>
      </div>
    `,
    text: `
Emergency Contact Update

${message}

If you believe this email was sent in error, please contact MindMate support.
    `.trim(),
  };
};

/**
 * Compose inactivity reminder email
 */
export const composeInactivityReminderEmail = (primaryUserName) => {
  return {
    subject: 'Check in with yourself: We haven\'t seen you in a while',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">💙 Check-In Reminder</h2>
        
        <p>Hi ${primaryUserName},</p>
        
        <p>We've noticed you haven't accessed MindMate in a while. We'd love to see you again!</p>
        
        <p>Taking even a few minutes to:</p>
        <ul>
          <li>Log how you're feeling</li>
          <li>Review recommended wellness content</li>
          <li>Update your progress toward goals</li>
        </ul>
        
        <p>...can make a real difference in your wellbeing.</p>
        
        <p style="margin-top: 30px;">
          <a href="https://mindmate.com/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Go to Dashboard
          </a>
        </p>
        
        <p style="margin-top: 40px; font-size: 12px; color: #666;">If you need immediate support, reach out to a contact or call a support hotline.</p>
      </div>
    `,
    text: `
Check-In Reminder

Hi ${primaryUserName},

We've noticed you haven't accessed MindMate in a while. Your wellbeing matters to us!

Go to Dashboard: https://mindmate.com/dashboard

If you need immediate support, reach out to your emergency contacts.

MindMate Support
    `.trim(),
  };
};
