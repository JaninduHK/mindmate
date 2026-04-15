# Guardian Invitation Flow - Complete Fix

## Problem Summary

When a new emergency contact was added dynamically after initial signup and that contact signed up using the invitation link, the Guardian Dashboard would show "No monitored users" even though the invitation should have been accepted.

## Root Causes Identified

### 1. **Broken Token Verification** ❌
- The code was trying to match invitation tokens using bcrypt hash comparison
- Bcrypt generates a DIFFERENT hash every time for security - so `hashToken(token) === storedHash` would NEVER match
- **Solution**: Use `verifyTokenHash(token, hash)` instead which properly verifies bcrypt hashes

### 2. **Missing GuardianSignup Record** ❌
- When someone signed up with an invitation token, the invitation was accepted BUT GuardianSignup table was never populated
- The login function required GuardianSignup to exist to create GuardianSignin records
- This broke the entire tracking chain
- **Solution**: Create GuardianSignup record immediately when invitation is accepted during signup

### 3. **Missing GuardianSignin Creation** ❌
- Even if GuardianSignup existed, the fallback logic wasn't handling cases where GuardianSignup was missing
- **Solution**: Add fallback to create GuardianSignup from EmergencyContact if missing during login

## Implementation Details

### Fixed Files

#### 1. `/backend/controllers/auth.controller.js` - Register Function

**BEFORE:**
```javascript
const tokenHash = hashToken(invitationToken);  // ❌ Wrong - creates new hash each time
const pendingContact = await EmergencyContact.findOne({
  inviteTokenHash: tokenHash,  // ❌ Will never match
  email: email.toLowerCase(),
});
```

**AFTER:**
```javascript
// Find by email first
const pendingContact = await EmergencyContact.findOne({
  email: email.toLowerCase(),
  inviteStatus: 'pending',
})
  .select('+inviteTokenHash')
  .populate('ownerUserId', 'name email');

// Then verify token properly
if (pendingContact) {
  const isValidToken = verifyTokenHash(invitationToken, pendingContact.inviteTokenHash); // ✅ Correct verification
  if (!isValidToken) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid invitation token');
  }
}
```

**Added GuardianSignup Creation:**
```javascript
if (acceptedInvitation) {
  // Accept the invitation
  acceptedInvitation.contactUserId = user._id;
  acceptedInvitation.inviteStatus = 'accepted';
  await acceptedInvitation.save();
  
  // ✅ Create GuardianSignup record for tracking
  const guardianSignup = await GuardianSignup.create({
    userId: user._id,
    emergencyContactId: acceptedInvitation._id,
    monitoredUserId: acceptedInvitation.ownerUserId._id,
    fullName: user.name,
    email: user.email,
    phoneNumber: acceptedInvitation.phoneNumber,
    relationship: acceptedInvitation.relationship,
    signupStatus: 'completed',
    isVerified: true,
  });
}
```

#### 2. `/backend/controllers/auth.controller.js` - Login Function

**Added Fallback GuardianSignup Creation:**
```javascript
if (user.role === 'emergency_contact') {
  let guardianSignup = await GuardianSignup.findOne({ userId: user._id });
  
  // If GuardianSignup doesn't exist, create from EmergencyContact
  if (!guardianSignup) {
    const emergencyContact = await EmergencyContact.findOne({
      contactUserId: user._id,
      inviteStatus: 'accepted',
    }).populate('ownerUserId', '_id name email');
    
    if (emergencyContact) {
      guardianSignup = await GuardianSignup.create({
        userId: user._id,
        emergencyContactId: emergencyContact._id,
        monitoredUserId: emergencyContact.ownerUserId._id,
        // ... other fields
      });
    }
  }
  
  // Then create GuardianSignin from GuardianSignup
  if (guardianSignup) {
    await GuardianSignin.create({
      userId: user._id,
      monitoredUserId: guardianSignup.monitoredUserId,
      // ... other fields
    });
  }
}
```

## Complete Flow Now

### Signup with Invitation Flow:
1. User A adds User B as emergency contact
   - Creates EmergencyContact record with `inviteStatus: 'pending'` and `inviteTokenHash`
   - Sends invitation email with token

2. User B clicks invitation link → signup with `?token=xxx`
   - Registers with `invitationToken` in request body
   - ✅ Token properly verified using `verifyTokenHash()`
   - ✅ User role set to `emergency_contact`
   - ✅ EmergencyContact record updated: `contactUserId` set, `inviteStatus: 'accepted'`
   - ✅ **NEW**: GuardianSignup record created with all tracking info

3. User B logs in
   - ✅ Finds GuardianSignup record
   - ✅ Creates GuardianSignin record for this session
   - If GuardianSignup missing, creates it from EmergencyContact (fallback)

4. User B visits Guardian Dashboard
   - GuardianAPI calls `getMonitoredUsers()`
   - Queries EmergencyContact where `contactUserId = UserB._id` and `inviteStatus = 'accepted'`
   - ✅ Finds User A's record and returns monitored users list
   - Analytics endpoints can now fetch data using proper ObjectId conversion

## Testing

### Manual Test Process:

1. **User A creates account and logs in**
   ```
   Email: steshan@gmail.com
   Password: Test123!@#
   ```

2. **User A adds Saman as emergency contact**
   - Go to Emergency Contacts page
   - Click "Add Contact"
   - Fill: Email = saman@gmail.com, Name = Saman, Relationship = Therapist
   - Submit → Saman gets invitation email

3. **Saman receives email invitation**
   - Click the link in email → goes to `localhost:3000/guardian-signup?token=xxx`

4. **Saman signs up with the token**
   - Name: Saman Khan
   - Email: saman@gmail.com
   - Password: Test123!@#
   - Submit → Account created, automatically accepted as guardian

5. **Saman logs in**
   - Email: saman@gmail.com
   - Password: Test123!@#
   - Login should succeed

6. **Saman visits Guardian Dashboard**
   - Should see "Steshan" in "Select User to Monitor" dropdown ✅
   - Should see mood analytics and other data ✅

### Automated Test:

```bash
cd backend
npm install  # if needed
node test-guardian-invitation-flow.js
```

This will automatically test the complete flow and report success/failure.

## Debugging

If Guardian Dashboard still shows "No monitored users", check logs for:

```
[REGISTER] Processing invitation token for email: saman@gmail.com
[REGISTER] Found pending contact: Yes (owner: Steshan)
[REGISTER] Token verification: VALID
[REGISTER] Will accept invitation after user creation
[REGISTER] Accepting invitation for contact: ...
[REGISTER] GuardianSignup record created: ...

[LOGIN] User logged in: { email: saman@gmail.com, role: emergency_contact }
[LOGIN] Guardian login detected for user: ...
[LOGIN] GuardianSignup lookup: Found - monitoring ...
[LOGIN] GuardianSignin record created: ...

[MONITORED_USERS] Fetching for contact ID: ...
[MONITORED_USERS] Found contacts: 1
  [0] Owner: Steshan (..._id...)
```

If you see any of these as "No", "Not found", or "INVALID", the flow is breaking at that point.

## Data Consistency

### Tables Involved:

| Table | Purpose | When Updated |
|-------|---------|--------------|
| `User` | User account info | On registration |
| `EmergencyContact` | Invitation link | When contact added, updated when signed up |
| `GuardianSignup` | Guardian signup tracking | ✅ NOW created when invitation accepted |
| `GuardianSignin` | Login session tracking | When guardian logs in |
| `Mood` | User mood entries | When user logs mood |
| `Goal` | User goals | When user creates goal |

### For Guardian "Saman" monitoring "Steshan":

```
User (Steshan):
  _id: steshan-id
  role: user

User (Saman):
  _id: saman-id
  role: emergency_contact

EmergencyContact:
  _id: ec-id
  ownerUserId: steshan-id
  contactUserId: saman-id
  inviteStatus: accepted
  email: saman@gmail.com

GuardianSignup:
  userId: saman-id
  monitoredUserId: steshan-id
  emergencyContactId: ec-id
  status: completed

GuardianSignin:
  userId: saman-id
  monitoredUserId: steshan-id
  sessionId: ...
  accessToken: ...
```

## Summary of Changes

✅ **Fixed 3 Critical Issues:**
1. Token verification now uses proper bcrypt comparison
2. GuardianSignup record created during invitation acceptance
3. Fallback GuardianSignup creation during login for backwards compatibility

✅ **Enhanced Logging:**
- Detailed logs at each step of signup and login flow
- Easy debugging with clear success/failure indicators

✅ **Added Test Script:**
- `test-guardian-invitation-flow.js` for automated testing
- Tests complete flow from invitation to analytics access

✅ **Backwards Compatible:**
- Handles existing guardians without GuardianSignup records
- Automatically creates missing records
