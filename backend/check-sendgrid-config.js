import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

console.log('\n🔍 SENDGRID CONFIGURATION AUDIT\n');

const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL;

if (!apiKey) {
  console.error('❌ SENDGRID_API_KEY is not set in .env');
  process.exit(1);
}

if (!fromEmail) {
  console.error('❌ SENDGRID_FROM_EMAIL is not set in .env');
  process.exit(1);
}

console.log('📋 Current Configuration:');
console.log(`   API Key: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 10)}`);
console.log(`   From Email: ${fromEmail}`);

console.log('\n⚠️  IMPORTANT: SendGrid Sender Email Verification\n');
console.log('📌 The sender email MUST be verified in SendGrid before sending emails.\n');
console.log('Steps to verify:');
console.log('   1. Go to: https://app.sendgrid.com');
console.log('   2. Click on "Settings" in the left menu');
console.log('   3. Click on "Sender Authentication"');
console.log('   4. Look for "Verify an Email" section');
console.log('   5. Enter your sender email and verify');
console.log('   6. Check the verification email and confirm\n');

console.log('Current Sender Email: ' + fromEmail);
console.log('✋ Please verify this email in SendGrid before sending invitations\n');

console.log('Alternative: If you have a verified sender domain, you can use that instead.\n');
