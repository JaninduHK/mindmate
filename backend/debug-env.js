import dotenv from 'dotenv';

dotenv.config();

console.log('Environment Variables:');
console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY);
console.log('SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL);
console.log('All SENDGRID_* vars:');
Object.keys(process.env).forEach(key => {
  if (key.includes('SENDGRID')) {
    console.log(`  ${key}=${process.env[key]}`);
  }
});
