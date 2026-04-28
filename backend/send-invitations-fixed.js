import mongoose from 'mongoose';
import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';
import crypto from 'crypto';

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const sendInvitationsDebug = async () => {
  try {
    console.log('\n📧 SENDING EMERGENCY CONTACT INVITATIONS\n');
    
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    const db = mongoose.connection.db;

    // Get all emergency contacts
    const contacts = await db.collection('emergencycontacts').find({}).toArray();

    console.log(`📋 Found ${contacts.length} emergency contacts\n`);

    if (contacts.length === 0) {
      console.log('❌ No emergency contacts found!');
      await mongoose.connection.close();
      process.exit(1);
    }

    let successCount = 0;
    let failureCount = 0;

    for (const contact of contacts) {
      try {
        console.log(`\n📧 Sending to: ${contact.email}`);
        console.log(`   Name: ${contact.fullName}`);
        console.log(`   Relationship: ${contact.relationship}`);

        // Generate invitation token
        const invitationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Update emergency contact with token
        await db.collection('emergencycontacts').updateOne(
          { _id: contact._id },
          {
            $set: {
              invitationToken: invitationToken,
              invitationTokenExpiry: tokenExpiry,
              invitationSentAt: new Date(),
              invitationStatus: 'sent'
            }
          }
        );

        // Create invitation URL
        const invitationLink = `http://localhost:3000/guardian/register?token=${invitationToken}`;

        // Compose and send email
        const msg = {
          to: contact.email,
          from: fromEmail,
          subject: 'You\'re Invited to Join MindMate as an Emergency Contact Guardian',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
              <h2 style="color: #007bff; margin-top: 0;">🛡️ Welcome to MindMate Guardian Network!</h2>
              
              <p>Hello <strong>${contact.fullName}</strong>,</p>
              
              <p>You have been invited to join <strong>MindMate</strong> as an emergency contact guardian. Your role is crucial in providing support during times of need.</p>
              
              <div style="background-color: #e7f3ff; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 5px 0;"><strong>📌 Your Role:</strong> ${contact.relationship}</p>
                <p style="margin: 5px 0;"><strong>📱 Contact Phone:</strong> ${contact.phoneNumber}</p>
              </div>
              
              <p>As a guardian, you'll:</p>
              <ul style="color: #555; line-height: 1.8;">
                <li>Monitor the wellbeing of your assigned contact</li>
                <li>Receive alerts about mood changes or concerns</li>
                <li>Provide support and encouragement</li>
                <li>Access a secure dashboard for their wellness data</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${invitationLink}" style="display: inline-block; padding: 15px 40px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; cursor: pointer;">
                  ✅ Accept Invitation & Register
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; background-color: white; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">
                <strong>Or copy this link:</strong><br>
                <code style="word-break: break-all; font-size: 12px;">${invitationLink}</code>
              </p>
              
              <p style="color: #999; font-size: 13px; margin-top: 20px;">
                ⏰ <strong>Expires:</strong> ${tokenExpiry.toDateString()}<br>
                🔐 This link is for security purposes and should not be shared.
              </p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
              
              <p style="font-size: 12px; color: #999; margin: 0;">
                © 2026 MindMate. All rights reserved.<br>
                Questions? Reply to this email or visit www.mindmate.com
              </p>
            </div>
          `
        };

        const response = await sgMail.send(msg);
        
        console.log(`   ✅ Sent successfully!`);
        console.log(`      Status: ${response[0].statusCode}`);
        console.log(`      Message ID: ${response[0].headers['x-message-id']}`);
        
        successCount++;
      } catch (error) {
        console.error(`   ❌ Failed: ${error.message}`);
        if (error.response?.body) {
          console.error(`      Details: ${JSON.stringify(error.response.body)}`);
        }
        failureCount++;
      }
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 INVITATION SUMMARY`);
    console.log(`${'='.repeat(70)}`);
    console.log(`   ✅ Successfully sent: ${successCount}`);
    console.log(`   ❌ Failed: ${failureCount}`);
    console.log(`   📧 Total: ${successCount + failureCount}`);
    
    console.log(`\n💡 NEXT STEPS:`);
    console.log(`   1. Check your email inbox (and spam folder!) for invitations`);
    console.log(`   2. Click "Accept Invitation & Register"`) ;
    console.log(`   3. Complete your guardian profile`);
    console.log(`   4. Log in to start monitoring`);
    
    console.log(`\n🔐 Invitations expire in 7 days`);
    console.log(`${'='.repeat(70)}\n`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

connectDB().then(() => {
  setTimeout(sendInvitationsDebug, 1000);
});
