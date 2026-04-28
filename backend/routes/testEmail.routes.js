import express from 'express';
import { sendEmail } from '../utils/email.util.js';

const router = express.Router();

/**
 * Test SendGrid Email Integration
 * POST /test-sendgrid
 * Body: { to, subject, html }
 */
router.post('/test-sendgrid', async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject, html',
      });
    }

    await sendEmail({
      to,
      subject,
      html,
      text: 'Test email from MindMate',
    });

    res.json({
      success: true,
      message: `✅ Test email sent to ${to}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `❌ Failed to send test email: ${error.message}`,
    });
  }
});

/**
 * Test Emergency Contact Invitation Email
 * POST /test-emergency-invitation
 * Body: { to, contactName, ownerName, relationship }
 */
router.post('/test-emergency-invitation', async (req, res) => {
  try {
    const { to, contactName, ownerName, relationship } = req.body;

    if (!to || !contactName || !ownerName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, contactName, ownerName',
      });
    }

    // Compose a test invitation email
    const inviteLink = `${process.env.FRONTEND_URL}/register?token=test-token-123&type=emergency-contact`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">🛡️ Emergency Contact Invitation</h2>
        
        <p>Hi ${contactName},</p>
        
        <p>You have been invited to the <strong>MindMate</strong> website to create an account to support <strong>${ownerName}</strong>.</p>
        
        <p><strong>${ownerName}</strong> has added you as their emergency contact (${relationship || 'Family Member'}).</p>
        
        <p><strong>What's Next?</strong></p>
        <ul>
          <li>Monitor mood tracking and goal progress</li>
          <li>Receive alerts for critical mental health events</li>
          <li>Provide support and encouragement</li>
        </ul>
        
        <p style="margin-top: 30px;">
          <a href="${inviteLink}" style="background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Accept Invitation & Register
          </a>
        </p>
        
        <p style="font-size: 12px;"><em>This invitation will expire in 7 days.</em></p>
        
        <hr style="margin-top: 40px; border: none; border-top: 1px solid #ccc;">
        <p style="font-size: 12px; color: #666;">
          MindMate Support Team
        </p>
      </div>
    `;

    await sendEmail({
      to,
      subject: `${ownerName} has invited you to be their MindMate Guardian`,
      html: htmlContent,
    });

    res.json({
      success: true,
      message: `✅ Test invitation email sent to ${to}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `❌ Failed to send invitation: ${error.message}`,
    });
  }
});

export default router;
