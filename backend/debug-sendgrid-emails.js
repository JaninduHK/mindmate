import mongoose from 'mongoose';
import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';

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

const debugEmails = async () => {
  try {
    console.log('\n🔍 DEBUGGING EMAIL SENDING\n');
    
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    const apiKey = process.env.SENDGRID_API_KEY;

    console.log('📋 Configuration:');
    console.log(`   From Email: ${fromEmail}`);
    console.log(`   API Key: ${apiKey.substring(0, 20)}...`);
    console.log(`   Database URI: ${process.env.MONGODB_URI.substring(0, 50)}...\n`);

    // Get emergency contacts from database
    const db = mongoose.connection.db;
    const contacts = await db.collection('emergencycontacts').find({}).toArray();

    console.log(`✅ Found ${contacts.length} emergency contacts in database:\n`);
    
    contacts.forEach((contact, index) => {
      console.log(`   ${index + 1}. Email: ${contact.email}`);
      console.log(`      Full Name: ${contact.fullName}`);
      console.log(`      Relationship: ${contact.relationship}`);
      console.log(`      Phone: ${contact.phoneNumber}`);
      console.log('');
    });

    // Try sending a test email to the first contact
    if (contacts.length > 0) {
      const testContact = contacts[0];
      
      console.log(`\n🧪 Sending test email to: ${testContact.email}\n`);

      const testMsg = {
        to: testContact.email,
        from: fromEmail,
        subject: '🧪 TEST - MindMate Emergency Contact Invitation',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #007bff;">TEST EMAIL - Invitation from MindMate</h2>
            <p>Hello ${testContact.fullName || 'Guardian'},</p>
            <p>This is a test email to verify SendGrid is working correctly.</p>
            <p><strong>Contact Details in Database:</strong></p>
            <ul>
              <li>Email: ${testContact.email}</li>
              <li>Full Name: ${testContact.fullName}</li>
              <li>Relationship: ${testContact.relationship}</li>
              <li>Phone: ${testContact.phoneNumber}</li>
            </ul>
            <p>If you received this email, SendGrid is working correctly!</p>
            <hr>
            <p style="font-size: 12px; color: #999;">Sent from MindMate Backend</p>
          </div>
        `
      };

      try {
        const response = await sgMail.send(testMsg);
        console.log('✅ Email sent successfully!');
        console.log(`   Response Status: ${response[0].statusCode}`);
        console.log(`   Message ID: ${response[0].headers['x-message-id']}`);
      } catch (error) {
        console.error('❌ Error sending test email:');
        console.error(`   Error Code: ${error.code}`);
        console.error(`   Error Message: ${error.message}`);
        if (error.response) {
          console.error(`   Response: ${JSON.stringify(error.response.body, null, 2)}`);
        }
      }
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

connectDB().then(() => {
  setTimeout(debugEmails, 1000);
});
