#!/usr/bin/env node

/**
 * Test Script: Complete Guardian Invitation Flow
 * ================================================
 * 
 * This script tests the complete flow:
 * 1. User A adds User B as emergency contact
 * 2. User B signs up with the invitation token
 * 3. User B logs in
 * 4. User B sees User A in monitored users
 * 
 * Usage: node test-guardian-invitation-flow.js
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testGuardianInvitationFlow() {
  console.log('\n🧪 Testing Guardian Invitation Flow\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Create User A (the main user)
    console.log('\n📝 Step 1: Registering User A (main user)...');
    const userAResponse = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'User A',
      email: `userA_${Date.now()}@test.com`,
      password: 'Test123!@#',
    });
    const userA = userAResponse.data.data.user;
    const userAToken = userAResponse.data.data.accessToken;
    console.log(`✅ User A created: ${userA._id}`);
    console.log(`   Email: ${userA.email}`);
    console.log(`   Role: ${userA.role}`);

    // Step 2: User A adds User B as emergency contact
    console.log('\n👥 Step 2: User A adding User B as emergency contact...');
    const userBEmail = `userB_${Date.now()}@test.com`;
    const addContactResponse = await axios.post(
      `${BASE_URL}/emergency-contacts`,
      {
        fullName: 'User B',
        email: userBEmail,
        phoneNumber: '+1234567890',
        relationship: 'therapist',
      },
      { headers: { Authorization: `Bearer ${userAToken}` } }
    );
    const invitationToken = addContactResponse.data.data.invitationToken;
    console.log(`✅ Emergency contact added`);
    console.log(`   Invitation token generated: ${invitationToken.substring(0, 20)}...`);
    console.log(`   Status: ${addContactResponse.data.data.inviteStatus}`);

    // Step 3: User B signs up with the invitation token
    console.log('\n🔐 Step 3: User B signing up with invitation token...');
    const userBSignupResponse = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'User B',
      email: userBEmail,
      password: 'Test123!@#',
      invitationToken: invitationToken,
    });
    const userB = userBSignupResponse.data.data.user;
    const userBToken = userBSignupResponse.data.data.accessToken;
    console.log(`✅ User B created: ${userB._id}`);
    console.log(`   Email: ${userB.email}`);
    console.log(`   Role: ${userB.role}`);
    console.log(`   Invitation accepted: ${userBSignupResponse.data.data.invitationAccepted?.success || 'Check logs'}`);

    await sleep(1000);

    // Step 4: User B logs in
    console.log('\n🔑 Step 4: User B logging in...');
    const userBLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: userBEmail,
      password: 'Test123!@#',
    });
    const userBLoginToken = userBLoginResponse.data.data.accessToken;
    console.log(`✅ User B logged in successfully`);
    console.log(`   Role confirmed: ${userBLoginResponse.data.data.user.role}`);

    await sleep(1000);

    // Step 5: User B fetches monitored users
    console.log('\n📊 Step 5: User B fetching Guardian Dashboard - monitored users...');
    const monitoredUsersResponse = await axios.get(
      `${BASE_URL}/guardian/monitored-users`,
      { headers: { Authorization: `Bearer ${userBLoginToken}` } }
    );
    const monitoredUsers = monitoredUsersResponse.data.data;
    console.log(`✅ Monitored users retrieved: ${monitoredUsers.length} user(s)`);

    if (monitoredUsers.length === 0) {
      console.log('❌ ERROR: No monitored users found!');
      console.log('   Expected: User A should be in the list');
      console.log('\n📋 Checking EmergencyContact records...');
      
      // Debug: check emergency contact
      const checkContactResponse = await axios.get(
        `${BASE_URL}/emergency-contacts`,
        { headers: { Authorization: `Bearer ${userAToken}` } }
      );
      console.log('   Contacts from User A perspective:', checkContactResponse.data.data);
      return false;
    }

    monitoredUsers.forEach((user, i) => {
      console.log(`\n   User ${i + 1}: ${user.name} (${user.email})`);
      console.log(`   - User ID: ${user.userId}`);
      console.log(`   - Current Mood: ${user.currentMood?.title || 'No mood entry'}`);
      console.log(`   - Active Goals: ${user.goals?.length || 0}`);
    });

    // Step 6: User B fetches analytics
    console.log('\n📈 Step 6: User B fetching analytics for monitored user...');
    const analyticsResponse = await axios.get(
      `${BASE_URL}/guardian/${monitoredUsers[0].userId}/analytics/summary`,
      { headers: { Authorization: `Bearer ${userBLoginToken}` } }
    );
    const analytics = analyticsResponse.data.data;
    console.log(`✅ Analytics retrieved`);
    console.log(`   Most common mood: ${analytics.mostCommonMood || 'No data'}`);
    console.log(`   Mood distribution entries: ${analytics.moodDistribution?.length || 0}`);
    console.log(`   Goal summary entries: ${analytics.goalSummary?.length || 0}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED! Guardian invitation flow is working correctly.');
    console.log('='.repeat(60) + '\n');
    return true;

  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    console.error('Error:', error.response?.data?.message || error.message);
    if (error.response?.data?.error) {
      console.error('Details:', error.response.data.error);
    }
    console.error('\n' + '='.repeat(60) + '\n');
    return false;
  }
}

// Run the test
testGuardianInvitationFlow().then(success => {
  process.exit(success ? 0 : 1);
});
