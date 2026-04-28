import mongoose from 'mongoose';
import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';

dotenv.config();

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Define EmergencyContact schema
const emergencyContactSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  relationship: String,
  monitoredUserId: mongoose.Schema.Types.ObjectId,
  invitationToken: String,
  invitationTokenExpiry: Date,
  isRegistered: Boolean,
  createdAt: Date
});

const EmergencyContact = mongoose.model('EmergencyContact', emergencyContactSchema);

// Send invitations
const sendInvitations = async () => {
  try {
    // Get all unregistered emergency contacts
    const emergencyContacts = await EmergencyContact.find({ isRegistered: false });

    console.log(`\n📧 Found ${emergencyContacts.length} unregistered emergency contacts\n`);

    if (emergencyContacts.length === 0) {
      console.log('ℹ️  No unregistered emergency contacts found.');
      await mongoose.connection.close();
      process.exit(0);
    }

    let successCount = 0;
    let failureCount = 0;

    for (const contact of emergencyContacts) {
      try {
        const invitationLink = `http://localhost:5173/guardian/register?token=${contact.invitationToken}`;

        const msg = {
          to: contact.email,
          from: process.env.SENDGRID_FROM_EMAIL || 'noreply@mindmate.com',
          subject: 'You\'re Invited to Join MindMate as an Emergency Contact Guardian',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome to MindMate!</h2>
              <p>Hello <strong>${contact.name}</strong>,</p>
              <p>You have been invited to join MindMate as an emergency contact guardian. Your role is to provide support and be available in times of need.</p>
              
              <p><strong>Your Relationship:</strong> ${contact.relationship}</p>
              <p><strong>Your Phone:</strong> ${contact.phone}</p>
              
              <p>Click the button below to register and activate your guardian account:</p>
              <p>
                <a href="${invitationLink}" style="display: inline-block; padding: 12px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                  Accept Invitation & Register
                </a>
              </p>
              
              <p>Or copy and paste this link: ${invitationLink}</p>
              
              <p>This invitation link expires in 7 days.</p>
              <hr style="margin-top: 30px;">
              <p style="font-size: 12px; color: #666;">© 2026 MindMate. All rights reserved.</p>
            </div>
          `
        };

        await sgMail.send(msg);
        console.log(`✅ Invitation sent to: ${contact.email} (${contact.name})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to send invitation to ${contact.email}:`, error.message);
        failureCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failureCount}`);
    console.log(`\n💡 Check your email inbox/spam folder to verify receipt of invitations.`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run
connectDB().then(() => {
  setTimeout(sendInvitations, 2000);
});
