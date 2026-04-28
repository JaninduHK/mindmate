import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

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

const checkStatus = async () => {
  try {
    const contacts = await EmergencyContact.find().select('email relationship invitationToken invitationTokenExpiry');
    
    console.log(`\n${'='.repeat(80)}`);
    console.log('📋 EMERGENCY CONTACT INVITATIONS STATUS');
    console.log(`${'='.repeat(80)}\n`);
    
    console.log(`Total contacts: ${contacts.length}\n`);
    
    let withTokens = 0;
    let withoutTokens = 0;
    
    contacts.forEach((contact, index) => {
      console.log(`${index + 1}. ${contact.email}`);
      console.log(`   Relationship: ${contact.relationship}`);
      
      if (contact.invitationToken) {
        console.log(`   ✅ Token Generated: Yes`);
        console.log(`   ⏰ Expires: ${contact.invitationTokenExpiry?.toDateString()}`);
        console.log(`   🔗 Token: ${contact.invitationToken.substring(0, 20)}...`);
        withTokens++;
      } else {
        console.log(`   ⚠️  Token Generated: No`);
        withoutTokens++;
      }
      console.log();
    });
    
    console.log(`${'='.repeat(80)}`);
    console.log(`📊 SUMMARY`);
    console.log(`${'='.repeat(80)}`);
    console.log(`✅ With Tokens Ready to Send: ${withTokens}`);
    console.log(`⚠️  Without Tokens: ${withoutTokens}`);
    console.log(`\n🔐 All tokens are valid for 7 days\n`);
    
    if (withTokens > 0) {
      console.log(`✅ Ready to send! Just verify a sender email in SendGrid and run the invitation script.`);
    }
    
    console.log(`${'='.repeat(80)}\n`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

connectDB().then(() => {
  setTimeout(checkStatus, 1000);
});
