import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

// Create a valid JWT token for the test user
const userId = '69d9dec7f68574bb5524cb39'; // samaratungesteshan@gmail.com who has data
const token = jwt.sign(
  { userId },
  process.env.ACCESS_TOKEN_SECRET || 'test-secret',
  { expiresIn: '1h' }
);

console.log('Token created:', token);
console.log('User ID:', userId);

const test = async () => {
  try {
    console.log('\n🧪 Testing analytics endpoint...');
    const response = await fetch('http://localhost:5001/api/personal-tracking/analytics/summary?startDate=2026-04-01&endDate=2026-04-27', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('✅ Response status:', response.status);
    const data = await response.json();
    console.log('✅ Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

test();
