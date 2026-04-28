import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send an email using SendGrid
 * @param {Object} options - { to, subject, html, text }
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const message = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@mindmate.com',
      subject,
      html: html || text,
      text: text || 'Please view this email in HTML format.',
    };

    const response = await sgMail.send(message);
    console.log(`✅ Email sent to ${to} - ${subject}`);
    return response;
  } catch (error) {
    // Log but don't throw — email failure should not break the request
    console.error('❌ SendGrid Email Error:', error.message);
  }
};

export const emailTemplates = {
  bookingConfirmed: (eventTitle, startDate) => ({
    subject: `Booking Confirmed: ${eventTitle}`,
    html: `
      <h2>Your booking is confirmed!</h2>
      <p>You are registered for <strong>${eventTitle}</strong>.</p>
      <p>Date: ${new Date(startDate).toLocaleString()}</p>
      <p>Thank you for choosing MindMate.</p>
    `,
  }),
  bookingCancelled: (eventTitle) => ({
    subject: `Booking Cancelled: ${eventTitle}`,
    html: `
      <h2>Your booking has been cancelled.</h2>
      <p>Your booking for <strong>${eventTitle}</strong> has been cancelled.</p>
      <p>If a refund is applicable, it will be processed within 5-7 business days.</p>
    `,
  }),
  paymentReceived: (eventTitle, amount) => ({
    subject: `Payment Received for ${eventTitle}`,
    html: `
      <h2>Payment Received</h2>
      <p>We received your payment of <strong>$${(amount / 100).toFixed(2)}</strong> for <strong>${eventTitle}</strong>.</p>
    `,
  }),
};
