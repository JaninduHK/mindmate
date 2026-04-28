import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

// Test user credentials
const TEST_USER = {
  email: 'samaratungesteshan@gmail.com',
  password: 'Steshan@2003'
};

const testSendAllInvitations = async () => {
  try {
    console.log('\n🧪 TESTING SEND ALL INVITATIONS ENDPOINT\n');

    // Step 1: Login
    console.log('📝 Step 1: Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    const { accessToken } = loginResponse.data.data;
    console.log('✅ Login successful');

    // Step 2: Call the new endpoint
    console.log('\n📧 Step 2: Calling send-all invitations endpoint...');
    const response = await axios.post(
      `${API_URL}/emergency-contacts/send-all/invitations`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ Response received from server:\n');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.data) {
      const { sent, failed, total, results } = response.data.data;
      
      console.log(`\n📊 SUMMARY:`);
      console.log(`   ✅ Successfully sent: ${sent}`);
      console.log(`   ❌ Failed: ${failed}`);
      console.log(`   📧 Total: ${total}`);

      if (results && results.length > 0) {
        console.log(`\n📬 Invitation Details:`);
        results.forEach((result, index) => {
          console.log(`   ${index + 1}. ${result.email} (${result.fullName}) - ${result.status}`);
          if (result.error) {
            console.log(`      Error: ${result.error}`);
          }
        });
      }
    }

    console.log('\n✅ Test completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Error testing endpoint:\n');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Message:', error.message);
    }
  }
};

testSendAllInvitations();
