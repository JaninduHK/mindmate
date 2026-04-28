import mongoose from 'mongoose';
import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';
import crypto from 'crypto';

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

// Token generation helper
const generateInvitationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Define schemas
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
}, { collection: 'emergencycontacts' });

const EmergencyContact = mongoose.model('EmergencyContact', emergencyContactSchema);

const userSchema = new mongoose.Schema({
  name: String,
  email: String
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

// Send invitations with debugging
const sendInvitations = async () => {
  try {
    console.log('\n🔍 SendGrid Configuration:');
    console.log(`   API Key: ${process.env.SENDGRID_API_KEY.substring(0, 20)}...`);
    console.log(`   From Email: ${process.env.SENDGRID_FROM_EMAIL}`);
    console.log(`   API Key Present: ${!!process.env.SENDGRID_API_KEY}`);

    // Get all emergency contacts
    const emergencyContacts = await EmergencyContact.find();

    console.log(`\n📧 Found ${emergencyContacts.length} emergency contacts\n`);

    if (emergencyContacts.length === 0) {
      console.log('ℹ️  No emergency contacts found.');
      await mongoose.connection.close();
      process.exit(0);
    }

    let successCount = 0;
    let failureCount = 0;

    // Test sending to first contact only
    const testContact = emergencyContacts[0];
    console.log(`📬 Testing email send to: ${testContact.email}\n`);

    try {
      // Generate invitation token
      const invitationToken = generateInvitationToken();
      const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Update emergency contact with token
      await EmergencyContact.updateOne(
        { _id: testContact._id },
        {
          invitationToken: invitationToken,
          invitationTokenExpiry: tokenExpiry
        }
      );

      // Get monitored user info
      let userNameInfo = 'a MindMate user';
      if (testContact.monitoredUserId) {
        const user = await User.findById(testContact.monitoredUserId);
        if (user) {
          userNameInfo = user.name || 'a MindMate user';
        }
      }

      // Generate invitation URL
      const invitationLink = `http://localhost:5173/guardian/register?token=${invitationToken}`;

      // Test email with detailed logging
      const msg = {
        to: testContact.email,
        from: 'noreply@mindmate.com', // Try with a domain-based email
        subject: 'You\'re Invited to Join MindMate as an Emergency Contact Guardian',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #007bff;">Welcome to MindMate!</h2>
            <p>Hello,</p>
            <p>You have been invited to join <strong>MindMate</strong> as an emergency contact guardian.</p>
            <p><strong>Relationship:</strong> ${testContact.relationship}</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationLink}" style="display: inline-block; padding: 15px 40px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Accept Invitation & Register
              </a>
            </div>
            <p style="font-size: 12px; color: #666;">Invitation expires on ${tokenExpiry.toDateString()}</p>
          </div>
        `
      };

      console.log('📨 Sending message with:');
      console.log(`   To: ${msg.to}`);
      console.log(`   From: ${msg.from}`);
      console.log(`   Subject: ${msg.subject}`);

      const response = await sgMail.send(msg);
      console.log('\n✅ Email sent successfully!');
      console.log(`   Response: ${JSON.stringify(response[0].headers)}`);
      successCount++;
    } catch (error) {
      console.error('\n❌ Error sending email:');
      console.error(`   Status: ${error.code}`);
      console.error(`   Message: ${error.message}`);
      if (error.response) {
        console.error(`   Response Body: ${JSON.stringify(error.response.body)}`);
      }
      failureCount++;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Test Result: ${successCount} success, ${failureCount} failed`);
    console.log(`${'='.repeat(60)}`);

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
