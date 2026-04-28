import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send email using SendGrid
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @returns {Promise} SendGrid response
 */
export const sendEmail = async ({ to, subject, html, text = '' }) => {
  try {
    const message = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject,
      html,
      text: text || 'Please view this email in HTML format.',
    };

    const response = await sgMail.send(message);
    console.log(`✅ Email sent to ${to} - ${subject}`);
    return response;
  } catch (error) {
    console.error('❌ SendGrid Email Error:', error.message);
    throw new Error(`Failed to send email to ${to}: ${error.message}`);
  }
};

/**
 * Send emergency contact invitation email
 * @param {Object} options
 * @param {string} options.to - Emergency contact email
 * @param {string} options.fullName - Emergency contact name
 * @param {string} options.userName - User name who added them
 * @param {string} options.invitationToken - Unique token for invitation
 * @returns {Promise}
 */
export const sendEmergencyContactInvitation = async ({
  to,
  fullName,
  userName,
  invitationToken,
}) => {
  const inviteLink = `${process.env.FRONTEND_URL}/register?token=${invitationToken}&type=emergency-contact`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
          .highlight { background: #f0f0f0; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ MindMate Emergency Contact Invitation</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${fullName}</strong>,</p>
            
            <p>Welcome to <strong>MindMate</strong>!</p>
            
            <p><strong>${userName}</strong> has added you as their emergency contact. This means you'll be able to monitor their mental health journey and provide support when needed.</p>
            
            <div class="highlight">
              <p><strong>What's Next?</strong></p>
              <p>Click the button below to create your guardian account and start supporting ${userName}:</p>
            </div>
            
            <center>
              <a href="${inviteLink}" class="button">Accept Invitation & Register</a>
            </center>
            
            <p style="color: #666; font-size: 12px;">Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #667eea; font-size: 12px;">${inviteLink}</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            
            <p><strong>About Your Role:</strong></p>
            <ul>
              <li>Monitor mood tracking and goal progress</li>
              <li>Receive alerts for critical mental health events</li>
              <li>Provide support and encouragement</li>
              <li>Access emergency contact information when needed</li>
            </ul>
            
            <div class="footer">
              <p>Questions? Contact our support team at help@mindmate.com</p>
              <p>&copy; 2026 MindMate. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `${userName} has invited you to be their MindMate Guardian`,
    html: htmlContent,
  });
};

export default sendEmail;
