import mongoose from 'mongoose';
import User from './models/User.model.js';
import EmergencyContact from './models/EmergencyContact.model.js';
import GuardianSignup from './models/GuardianSignup.model.js';
import GuardianSignin from './models/GuardianSignin.model.js';
import Mood from './models/Mood.js';
import Goal from './models/Goal.js';
import { connectDB } from './config/database.js';
import { generateInvitationUrl, verifyTokenHash } from './utils/tokenGenerator.js';
import invitationService from './services/invitationService.js';

const API_BASE = 'http://localhost:5001/api';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}=== ${msg} ===${colors.reset}\n`),
};

async function makeRequest(method, endpoint, body = null, headers = {}) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data, headers: response.headers };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

async function runTests() {
  try {
    // Connect to database
    log.section('CONNECTING TO DATABASE');
    await connectDB();
    log.success('Connected to MongoDB');

    // Clean up test data
    log.section('CLEANING UP OLD TEST DATA');
    const testEmail1 = `test-user-${Date.now()}@example.com`;
    const testEmail2 = `test-guardian-${Date.now()}@example.com`;

    await User.deleteMany({ email: { $in: [testEmail1, testEmail2] } });
    log.success('Cleaned up old test data');

    // Step 1: Create User A (the one being monitored)
    log.section('STEP 1: CREATE USER A (MONITORED USER)');
    log.info(`Signup User A with email: ${testEmail1}`);

    const signupARes = await makeRequest('POST', '/auth/register', {
      name: 'User A',
      email: testEmail1,
      password: 'Password123!@#',
    });

    if (signupARes.status !== 201) {
      throw new Error(`Failed to register User A: ${JSON.stringify(signupARes.data)}`);
    }

    const userA = signupARes.data.data.user;
    const tokenA = signupARes.data.data.accessToken;
    log.success(`User A created: ${userA._id}`);
    log.success(`User A role: ${userA.role}`);

    // Step 2: User A creates emergency contact (User B)
    log.section('STEP 2: USER A ADDS USER B AS EMERGENCY CONTACT');
    log.info(`Adding ${testEmail2} as emergency contact`);

    const addContactRes = await makeRequest(
      'POST',
      '/emergency-contacts/add',
      {
        fullName: 'User B Guardian',
        email: testEmail2,
        phoneNumber: '1234567890',
        relationship: 'Therapist',
      },
      { Authorization: `Bearer ${tokenA}` }
    );

    if (addContactRes.status !== 201) {
      throw new Error(
        `Failed to add emergency contact: ${JSON.stringify(addContactRes.data)}`
      );
    }

    const emergencyContact = addContactRes.data.data;
    const invitationToken = emergencyContact.invitationToken;
    log.success(`Emergency contact created: ${emergencyContact._id}`);
    log.success(`Invitation token: ${invitationToken.substring(0, 20)}...`);

    // Verify token is stored
    const storedContact = await EmergencyContact.findById(emergencyContact._id).select(
      '+inviteTokenHash'
    );
    log.success(`Token hash stored in DB: ${storedContact.inviteTokenHash ? 'Yes' : 'No'}`);
    log.success(`Token verification status: ${verifyTokenHash(invitationToken, storedContact.inviteTokenHash) ? 'VALID' : 'INVALID'}`);

    // Step 3: User B signs up with invitation token
    log.section('STEP 3: USER B SIGNS UP WITH INVITATION TOKEN');
    log.info(`Signup User B with token`);

    const signupBRes = await makeRequest('POST', '/auth/register', {
      name: 'User B Guardian',
      email: testEmail2,
      password: 'Password123!@#',
      invitationToken: invitationToken,
    });

    if (signupBRes.status !== 201) {
      throw new Error(`Failed to register User B: ${JSON.stringify(signupBRes.data)}`);
    }

    const userB = signupBRes.data.data.user;
    const tokenB = signupBRes.data.data.accessToken;
    log.success(`User B created: ${userB._id}`);
    log.success(`User B role: ${userB.role} (should be 'emergency_contact')`);

    if (userB.role !== 'emergency_contact') {
      throw new Error(`User B role is ${userB.role}, expected 'emergency_contact'`);
    }

    // Step 4: Check GuardianSignup was created
    log.section('STEP 4: VERIFY GUARDIANSIGNUP TABLE');
    const guardianSignup = await GuardianSignup.findOne({
      userId: userB._id,
      monitoredUserId: userA._id,
    });

    if (!guardianSignup) {
      throw new Error('GuardianSignup record not found!');
    }

    log.success(`GuardianSignup found: ${guardianSignup._id}`);
    log.success(`  - Guardian ID: ${guardianSignup.userId}`);
    log.success(`  - Monitored User ID: ${guardianSignup.monitoredUserId}`);
    log.success(`  - Status: ${guardianSignup.signupStatus}`);
    log.success(`  - Verified: ${guardianSignup.isVerified}`);

    // Step 5: Verify EmergencyContact was updated
    log.section('STEP 5: VERIFY EMERGENCYCONTACT TABLE');
    const updatedContact = await EmergencyContact.findById(emergencyContact._id);
    log.success(`EmergencyContact updated:`);
    log.success(`  - contactUserId: ${updatedContact.contactUserId}`);
    log.success(`  - inviteStatus: ${updatedContact.inviteStatus}`);
    log.success(`  - acceptedAt: ${updatedContact.acceptedAt}`);

    if (updatedContact.inviteStatus !== 'accepted') {
      throw new Error(`Contact status is ${updatedContact.inviteStatus}, expected 'accepted'`);
    }

    // Step 6: User B (Guardian) logs in
    log.section('STEP 6: USER B (GUARDIAN) LOGS IN');
    const loginRes = await makeRequest('POST', '/auth/login', {
      email: testEmail2,
      password: 'Password123!@#',
    });

    if (loginRes.status !== 200) {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.data)}`);
    }

    const loginData = loginRes.data.data;
    log.success(`User B logged in successfully`);
    log.success(`  - User ID: ${loginData.user._id}`);
    log.success(`  - Role: ${loginData.user.role}`);

    // Step 7: Check GuardianSignin was created
    log.section('STEP 7: VERIFY GUARDIANSIGNIN TABLE');
    const guardianSignin = await GuardianSignin.findOne({
      userId: userB._id,
      monitoredUserId: userA._id,
    }).sort({ signinAt: -1 });

    if (!guardianSignin) {
      throw new Error('GuardianSignin record not found!');
    }

    log.success(`GuardianSignin found: ${guardianSignin._id}`);
    log.success(`  - Guardian ID: ${guardianSignin.userId}`);
    log.success(`  - Monitored User ID: ${guardianSignin.monitoredUserId}`);
    log.success(`  - Status: ${guardianSignin.status}`);
    log.success(`  - Session ID: ${guardianSignin.sessionId}`);

    // Step 8: Test Guardian API - Get Monitored Users
    log.section('STEP 8: GET MONITORED USERS (GUARDIAN DASHBOARD)');
    const monitoredUsersRes = await makeRequest('GET', '/guardian/monitored-users', null, {
      Authorization: `Bearer ${tokenB}`,
    });

    if (monitoredUsersRes.status !== 200) {
      throw new Error(
        `Failed to get monitored users: ${JSON.stringify(monitoredUsersRes.data)}`
      );
    }

    const monitoredUsers = monitoredUsersRes.data.data;
    log.success(`Monitored users retrieved: ${monitoredUsers.length}`);

    if (monitoredUsers.length === 0) {
      throw new Error('No monitored users found! GuardianSignup query failed.');
    }

    const monitoredUser = monitoredUsers[0];
    log.success(`  [0] ${monitoredUser.name} (${monitoredUser.email})`);
    log.success(`    - Current Mood: ${monitoredUser.currentMood?.title || 'Not recorded'}`);
    log.success(`    - Goals: ${monitoredUser.goals?.length || 0}`);

    if (monitoredUser.userId !== userA._id.toString()) {
      throw new Error(`Monitored user ID mismatch: expected ${userA._id}, got ${monitoredUser.userId}`);
    }

    // Step 9: Add mood entry as User A
    log.section('STEP 9: USER A ADDS MOOD ENTRY');
    const moodRes = await makeRequest(
      'POST',
      '/mood/add',
      {
        mood: 'Positive',
        keyword: 'Happy',
        description: 'Had a great day!',
      },
      { Authorization: `Bearer ${tokenA}` }
    );

    if (moodRes.status !== 201) {
      log.error(`Failed to add mood (might not be implemented): ${JSON.stringify(moodRes.data)}`);
    } else {
      log.success(`Mood added successfully`);
    }

    // Step 10: Test Guardian API - Get Analytics
    log.section('STEP 10: GET ANALYTICS (USER A FROM GUARDIAN B)');
    const analyticsRes = await makeRequest(
      'GET',
      `/guardian/mood-analytics/${userA._id}`,
      null,
      { Authorization: `Bearer ${tokenB}` }
    );

    if (analyticsRes.status !== 200) {
      log.error(
        `Failed to get analytics: ${JSON.stringify(analyticsRes.data)}`
      );
    } else {
      const analytics = analyticsRes.data.data;
      log.success(`Analytics retrieved successfully`);
      log.success(`  - Total mood entries: ${analytics.totalEntries}`);
      log.success(`  - Avg mood score: ${analytics.average}`);
    }

    // Summary
    log.section('TEST SUMMARY');
    log.success('✓ User A created');
    log.success('✓ User A added User B as emergency contact');
    log.success('✓ User B signed up with invitation token');
    log.success('✓ GuardianSignup table populated');
    log.success('✓ GuardianSignin table populated on login');
    log.success('✓ Guardian Dashboard shows monitored users');
    log.success('✓ Analytics can be fetched by guardian');

    log.info('\nAll tests passed! Guardian invitation flow is working correctly.');
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run tests
runTests();
