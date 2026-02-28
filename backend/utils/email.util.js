import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
};

/**
 * Send an email.
 * @param {Object} options - { to, subject, html, text }
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const t = getTransporter();
    const from = process.env.EMAIL_FROM || 'MindMate <noreply@mindmate.com>';
    await t.sendMail({ from, to, subject, html, text });
  } catch (error) {
    // Log but don't throw — email failure should not break the request
    console.error('Email send error:', error.message);
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
