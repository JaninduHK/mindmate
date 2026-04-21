/**
 * Emergency alert email templates
 */

export const composeEmergencyAlertEmail = (
  contactName,
  userName,
  message,
  location,
  userEmail,
  userPhone,
  additionalDetails = {}
) => {
  const { severity = 'high', details, timestamp } = additionalDetails;
  const severityColor = severity === 'critical' ? '#dc2626' : severity === 'high' ? '#f97316' : '#eab308';
  const severityLabel = severity === 'critical' ? 'CRITICAL' : severity === 'high' ? 'HIGH' : 'MODERATE';

  return {
    subject: `🚨 EMERGENCY ALERT: ${userName} needs your help - Action Required`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid ${severityColor};">
        <div style="background-color: ${severityColor}; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🚨 EMERGENCY ALERT 🚨</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Severity: <strong>${severityLabel}</strong></p>
        </div>

        <div style="padding: 20px; background-color: #f5f5f5;">
          <p style="font-size: 16px; color: #333;">Hi ${contactName},</p>

          <div style="background-color: white; padding: 15px; border-left: 4px solid ${severityColor}; margin: 20px 0;">
            <p><strong>${userName} has triggered an emergency alert and needs your immediate help.</strong></p>
            
            <h3 style="color: #333; margin-top: 15px;">Emergency Details:</h3>
            <ul style="color: #555; line-height: 1.8;">
              <li><strong>Name:</strong> ${userName}</li>
              <li><strong>Status:</strong> Requires immediate assistance</li>
              <li><strong>Message:</strong> ${message || '(No message provided)'}</li>
              ${location ? `<li><strong>Location:</strong> ${location}</li>` : ''}
              <li><strong>Email:</strong> <a href="mailto:${userEmail}">${userEmail}</a></li>
              ${userPhone ? `<li><strong>Phone:</strong> <a href="tel:${userPhone}">${userPhone}</a></li>` : ''}
              ${timestamp ? `<li><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</li>` : ''}
            </ul>
            
            ${details ? `
              <h3 style="color: #333; margin-top: 15px;">Additional Information:</h3>
              <p style="color: #555; white-space: pre-wrap;">${details}</p>
            ` : ''}
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #856404;">⚠️ Immediate Action Recommended:</h3>
            <ol style="color: #856404;">
              <li><strong>Call ${userName} immediately</strong> at ${userPhone || 'the phone number provided'}</li>
              <li><strong>Check their location</strong> and ensure their safety</li>
              <li><strong>Contact emergency services</strong> if they are in immediate danger (call 911 or your local emergency number)</li>
              <li><strong>Notify other emergency contacts</strong> or family members</li>
            </ol>
          </div>

          <div style="background-color: #e8f4f8; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0369a1;">MindMate Guardian Support:</h3>
            <p style="color: #0369a1; margin: 5px 0;">If you have a MindMate account, log in to your Guardian Dashboard to:</p>
            <ul style="color: #0369a1;">
              <li>View real-time updates from ${userName}</li>
              <li>Access their health and wellness information</li>
              <li>Communicate through the MindMate platform</li>
            </ul>
          </div>

          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666;">
            <strong>This is an automated emergency alert from MindMate.</strong> Please prioritize getting in touch with ${userName} immediately.
          </p>

          <p style="font-size: 12px; color: #999; margin: 10px 0 0 0;">
            MindMate Support | <a href="https://mindmate.com" style="color: #2563eb;">mindmate.com</a>
          </p>
        </div>
      </div>
    `,
    text: `
🚨 EMERGENCY ALERT - ACTION REQUIRED 🚨

Hi ${contactName},

${userName} has triggered an EMERGENCY ALERT and needs your immediate help.

EMERGENCY DETAILS:
- Name: ${userName}
- Status: Requires immediate assistance
- Message: ${message || '(No message provided)'}
${location ? `- Location: ${location}` : ''}
- Email: ${userEmail}
${userPhone ? `- Phone: ${userPhone}` : ''}
${timestamp ? `- Time: ${new Date(timestamp).toLocaleString()}` : ''}

${details ? `\nADDITIONAL INFORMATION:\n${details}` : ''}

IMMEDIATE ACTION RECOMMENDED:
1. Call ${userName} immediately at ${userPhone || 'the phone number provided'}
2. Check their location and ensure their safety
3. Contact emergency services if they are in immediate danger (call 911 or your local emergency number)
4. Notify other emergency contacts or family members

If you have a MindMate account, log in to your Guardian Dashboard to view updates and communicate with ${userName}.

---
This is an automated emergency alert from MindMate. Please prioritize getting in touch with ${userName} immediately.
MindMate Support | mindmate.com
    `,
  };
};
