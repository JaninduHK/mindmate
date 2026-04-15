import fetch from 'node-fetch';

async function testAPI() {
  try {
    // Step 1: Login to get access token
    console.log('Step 1: Logging in as saman@akbar.com...');
    const loginRes = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'saman@akbar.com',
        password: 'password123'
      }),
      credentials: 'include'
    });

    const loginData = await loginRes.json();
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData);
      return;
    }

    const token = loginData.data.accessToken;
    console.log('✅ Got access token:', token.substring(0, 30) + '...');

    // Step 2: Fetch monitored users
    console.log('\nStep 2: Fetching monitored users...');
    const usersRes = await fetch('http://localhost:5001/api/guardian/monitored-users', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    const usersData = await usersRes.json();
    console.log('✅ Response status:', usersRes.status);
    console.log('✅ Response data:');
    console.log(JSON.stringify(usersData, null, 2));

    if (usersData.success && usersData.data && usersData.data.data) {
      console.log(`\n✅ Found ${usersData.data.data.length} monitored users`);
      usersData.data.data.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.name} (${user.email})`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
