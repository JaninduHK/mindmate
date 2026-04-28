import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

// Use one of the guardian's authentication token
// We'll need to login first, or use a test token

const testGuardianEndpoints = async () => {
  try {
    console.log('\n🔍 Testing Guardian Endpoints\n');

    // First, login as a guardian to get an auth token
    console.log('1️⃣ Logging in as guardian (chamindu@gmail.com)...');
    const loginResponse = await axios.post(`${API_URL}/auth/signin`, {
      email: 'chamindu@gmail.com',
      password: 'Test@123', // Adjust if different
    }).catch(err => {
      console.log('⚠️ Login failed - trying with different password');
      return null;
    });

    if (!loginResponse) {
      console.log('❌ Cannot test - need guardian password');
      console.log('Please run: curl -X POST http://localhost:5001/api/guardian/monitored-users -H "Authorization: Bearer <token>"');
      process.exit(0);
    }

    const token = loginResponse.data.data.accessToken;
    console.log('✅ Logged in successfully\n');

    // Test /guardian/monitored-users endpoint
    console.log('2️⃣ Fetching monitored users...');
    const monitoredResponse = await axios.get(
      `${API_URL}/guardian/monitored-users`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Response Status:', monitoredResponse.status);
    console.log('📊 Response Data:', JSON.stringify(monitoredResponse.data, null, 2));

    // Test mood analytics for each user
    if (monitoredResponse.data.data && monitoredResponse.data.data.length > 0) {
      const user = monitoredResponse.data.data[0];
      console.log(`\n3️⃣ Fetching mood analytics for user ${user.name} (${user.userId})...`);
      
      try {
        const moodResponse = await axios.get(
          `${API_URL}/guardian/${user.userId}/moods/analytics`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('✅ Mood Analytics:', JSON.stringify(moodResponse.data, null, 2));
      } catch (error) {
        console.log('❌ Mood Analytics Error:', error.response?.data || error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

testGuardianEndpoints();
