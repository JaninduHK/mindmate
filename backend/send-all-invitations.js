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
}, { collection: 'emergencycontacts' });

const EmergencyContact = mongoose.model('EmergencyContact', emergencyContactSchema);

// ContactInvitation schema for tracking
const contactInvitationSchema = new mongoose.Schema({
  ownerUserId: mongoose.Schema.Types.ObjectId,
  emergencyContactId: mongoose.Schema.Types.ObjectId,
  tokenHash: String,
  expiresAt: Date,
  status: String,
  createdAt: { type: Date, default: Date.now }
}, { collection: 'contactinvitations' });

const ContactInvitation = mongoose.model('ContactInvitation', contactInvitationSchema);

// User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

// Send invitations
const sendInvitations = async () => {
  try {
    // Use the email from .env - this MUST be verified in SendGrid
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'samaratungesteshan@gmail.com';

    console.log('\n🔍 SendGrid Configuration:');
    console.log(`   From Email: ${fromEmail}`);
    console.log(`   API Key: ${process.env.SENDGRID_API_KEY.substring(0, 20)}...`);

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
    const sentEmails = [];

    for (const contact of emergencyContacts) {
      try {
        // Generate invitation token
        const invitationToken = generateInvitationToken();
        const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Update emergency contact with token
        await EmergencyContact.updateOne(
          { _id: contact._id },
          {
            invitationToken: invitationToken,
            invitationTokenExpiry: tokenExpiry
          }
        );

        // Create invitation record
        const tokenHash = crypto.createHash('sha256').update(invitationToken).digest('hex');
        await ContactInvitation.create({
          emergencyContactId: contact._id,
          tokenHash: tokenHash,
          expiresAt: tokenExpiry,
          status: 'pending'
        });

        // Get monitored user info
        let userNameInfo = 'a MindMate user';
        if (contact.monitoredUserId) {
          const user = await User.findById(contact.monitoredUserId);
          if (user) {
            userNameInfo = user.name || 'a MindMate user';
          }
        }

        // Generate invitation URL
        const invitationLink = `http://localhost:3000/guardian-signup?token=${invitationToken}`;

        // Compose email
        const msg = {
          to: contact.email,
          from: fromEmail,
          subject: 'You\'re Invited to Join MindMate as an Emergency Contact Guardian',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
                <h2 style="color: #007bff; margin-top: 0;">Welcome to MindMate!</h2>
                
                <p>Hello,</p>
                
                <p>You have been invited to join <strong>MindMate</strong> as an emergency contact guardian for <strong>${userNameInfo}</strong>.</p>
                
                <div style="background-color: #e7f3ff; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Relationship:</strong> ${contact.relationship}</p>
                  ${contact.phone ? `<p style="margin: 5px 0;"><strong>Contact Phone:</strong> ${contact.phone}</p>` : ''}
                </div>
                
                <p>As a guardian, you'll play a vital role in providing support and being available during times of need.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${invitationLink}" style="display: inline-block; padding: 15px 40px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                    Accept Invitation & Register
                  </a>
                </div>
                
                <p style="color: #666; font-size: 14px;">Or copy this link:</p>
                <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">
                  ${invitationLink}
                </p>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                  <strong>⏰ Expires: ${tokenExpiry.toDateString()}</strong>
                </p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                
                <p style="font-size: 12px; color: #999; margin: 0;">
                  © 2026 MindMate. All rights reserved.
                </p>
              </div>
            </div>
          `
        };

        await sgMail.send(msg);
        sentEmails.push(contact.email);
        console.log(`✅ Invitation sent to: ${contact.email} (${contact.relationship})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to send to ${contact.email}:`, error.message);
        failureCount++;
      }
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 INVITATION SUMMARY`);
    console.log(`${'='.repeat(70)}`);
    console.log(`   ✅ Successfully sent: ${successCount}`);
    console.log(`   ❌ Failed: ${failureCount}`);
    console.log(`   📧 Total: ${successCount + failureCount}`);

    if (sentEmails.length > 0) {
      console.log(`\n📬 Emails sent to:`);
      sentEmails.forEach(email => {
        console.log(`   • ${email}`);
      });
    }

    console.log(`\n💡 Next Steps:`);
    console.log(`   1. Check your email inbox/spam folder for the invitations`);
    console.log(`   2. Click the "Accept Invitation & Register" link`);
    console.log(`   3. Complete the registration process`);
    console.log(`   4. Log in with your credentials`);
    console.log(`\n🔐 Invitation links are valid for 7 days`);
    console.log(`${'='.repeat(70)}\n`);

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
