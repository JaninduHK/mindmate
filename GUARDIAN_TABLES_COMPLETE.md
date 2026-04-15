# Guardian Tables Implementation - Complete

## What Was Changed

You were right - since we created GuardianSignup and GuardianSignin tables, we SHOULD populate them and use them for tracking guardians separately. Here's what was fixed:

---

## Changes Made

### 1. **Guardian Controller Updates** ✅

Added imports for GuardianSignup and GuardianSignin:
```javascript
import GuardianSignup from '../models/GuardianSignup.model.js';
import GuardianSignin from '../models/GuardianSignin.model.js';
```

Updated 6 functions to query GuardianSignup instead of EmergencyContact:

#### `getGuardianUsersStatus()` → Now queries GuardianSignup
```javascript
// OLD: const emergencyContactLinks = await EmergencyContact.find({...})
// NEW: const guardianSignups = await GuardianSignup.find({...})
```

#### `getMonitoredUsers()` → Now queries GuardianSignup  
```javascript
// OLD: Find by contactUserId in EmergencyContact
// NEW: Find by userId in GuardianSignup and use monitoredUserId
```

#### `getGuardianDashboard()` → Authorization via GuardianSignup
```javascript
// OLD: Check EmergencyContact for authorization
// NEW: Check GuardianSignup for authorization
const guardianSignup = await GuardianSignup.findOne({
  userId: guardianId,
  monitoredUserId: userObjectId,
  isVerified: true,
});
```

#### `getUserMoodAnalytics()` → Authorization via GuardianSignup
```javascript
// Same pattern - verify via GuardianSignup
```

#### `getUserGoalAnalytics()` → Authorization via GuardianSignup
```javascript
// Same pattern - verify via GuardianSignup
```

#### `getMoodAlerts()` → Authorization via GuardianSignup
```javascript
// Same pattern - verify via GuardianSignup
```

---

## How Data Flows Now

### When Emergency Contact Accepts Invitation:

```
1. Email: addEmergencyContact() creates EmergencyContact record
   ↓
2. Invitation sent with token

3. Guardian signs up with token
   ↓
4. Backend verifies token (auth.controller.js register)
   ↓
5. Creates User with role='emergency_contact'
   ↓
6. Creates GuardianSignup record ← TRACKS THE RELATIONSHIP
   ↓
7. Updates EmergencyContact.inviteStatus = 'accepted'
```

### When Guardian Logs In:

```
1. Guardian enters credentials
   ↓
2. Backend verifies password
   ↓
3. Looks for GuardianSignup record (should exist from signup)
   ↓
4. If missing, creates it from EmergencyContact (fallback)
   ↓
5. Creates GuardianSignin record ← TRACKS THE SESSION
   ↓
6. Returns access token
```

### When Guardian Views Dashboard:

```
1. Frontend: GET /guardian/monitored-users
   ↓
2. Backend queries: GuardianSignup.find({ userId: guardianId, isVerified: true })
   ↓
3. Returns list of monitored users with:
   - monitoredUserId from GuardianSignup
   - User details from User collection
   - Latest mood from Mood collection
   - Goals from Goal collection
   ↓
4. Shows "Select User to Monitor" dropdown
   ↓
5. Guardian selects user → shows analytics
```

---

## Database Tables Now Used

### For Guardian Tracking:
| Table | When Populated | Purpose |
|-------|---|---|
| **GuardianSignup** | When emergency contact accepts invitation + signs up | Tracks WHO is a guardian and WHO they monitor |
| **GuardianSignin** | When guardian logs in | Tracks LOGIN SESSIONS and activity |

### For Relationship:
| Table | Purpose |
|-------|---|
| **User** | Stores guardian account (role='emergency_contact') |
| **EmergencyContact** | Legacy relationship record (still used for contact info) |

### Authorization Flow:
```
GuardianDashboard queries GuardianSignup:
- userId = logged-in guardian's ID
- monitoredUserId = selected user's ID
- isVerified = true

If found → AUTHORIZED ✅
If not found → DENIED ❌
```

---

## Complete Data Structure Example

When Saman (guardian) monitors Steshan (user):

```
User (Steshan):
  _id: 65a1c2d3e4f5g6h7i8j9k0l
  email: steshan@gmail.com
  role: user

User (Saman):
  _id: 65a2d3e4f5g6h7i8j9k0l1m
  email: saman@gmail.com
  role: emergency_contact

EmergencyContact:
  _id: 65a3e4f5g6h7i8j9k0l1m2n
  ownerUserId: 65a1c2d3e4f5g6h7i8j9k0l (Steshan)
  contactUserId: 65a2d3e4f5g6h7i8j9k0l1m (Saman)
  inviteStatus: accepted
  acceptedAt: 2024-04-15T10:30:00Z

GuardianSignup: ← SEPARATE TRACKING
  _id: 65a4f5g6h7i8j9k0l1m2n3o
  userId: 65a2d3e4f5g6h7i8j9k0l1m (Saman)
  monitoredUserId: 65a1c2d3e4f5g6h7i8j9k0l (Steshan)
  emergencyContactId: 65a3e4f5g6h7i8j9k0l1m2n
  signupStatus: completed
  isVerified: true
  tokenVerifiedAt: 2024-04-15T10:25:00Z

GuardianSignin: ← SESSION TRACKING
  _id: 65a5g6h7i8j9k0l1m2n3o4p
  userId: 65a2d3e4f5g6h7i8j9k0l1m (Saman)
  monitoredUserId: 65a1c2d3e4f5g6h7i8j9k0l (Steshan)
  sessionId: session_65a2d...
  signinAt: 2024-04-15T14:20:00Z
  status: active
```

---

## What This Enables

### ✅ Separate Guardian Tracking
- Can see WHO signed up as a guardian (GuardianSignup)
- Can see WHEN they signed up
- Can see WHO they're monitoring

### ✅ Session Management
- Can track login sessions (GuardianSignin)
- Can see last activity
- Can implement "session timeout" or "logout from all devices"

### ✅ Better Authorization
- Instead of checking EmergencyContact (relationship table)
- Check GuardianSignup (guardian account table)
- More reliable and intentional

### ✅ Analytics Per Guardian
- Can generate reports: "How many guardians are active?"
- "Which guardians monitor multiple users?"
- "Average guardian session duration?"

---

## Testing

Run the comprehensive test:
```bash
cd backend
npm run dev  # In one terminal

# In another terminal:
node test-guardian-signup-signin.js
```

**Expected Output:**
```
✓ User A created
✓ User A added User B as emergency contact
✓ User B signed up with invitation token
✓ GuardianSignup table populated
✓ GuardianSignin table populated on login
✓ Guardian Dashboard shows monitored users
✓ Analytics can be fetched by guardian

All tests passed!
```

---

## Manual Testing

1. **User A (monitored) creates account**
   - Email: user-a@example.com
   - Password: Test123!@#

2. **User A adds User B as guardian**
   - Go to Emergency Contacts
   - Add: Email = user-b@example.com, Name = User B, Relationship = Therapist
   - Send → User B gets email with invitation link

3. **User B signs up with invitation link**
   - Click link in email → `?token=xxx`
   - Register page shows "Accept Guardian Invitation"
   - Fill form and submit
   - **Check database**: GuardianSignup should be created ✅

4. **User B logs in**
   - Email: user-b@example.com
   - Password: Test123!@#
   - **Check database**: GuardianSignin should be created ✅

5. **User B views Guardian Dashboard**
   - Should see "Select User to Monitor" dropdown
   - Should show User A in list ✅
   - Should see mood analytics and other data ✅

---

## Debugging If Something Fails

Check the console logs for:

```
[REGISTER] Processing invitation token for email: user-b@example.com
[REGISTER] Token verification: VALID
[REGISTER] GuardianSignup record created: ...

[LOGIN] User logged in: { email: user-b@gmail.com, role: emergency_contact }
[LOGIN] GuardianSignup lookup: Found
[LOGIN] GuardianSignin record created: ...

[MONITORED_USERS] Fetching for guardian ID: ...
[MONITORED_USERS] Found GuardianSignup records: 1
```

If any of these show "INVALID", "Not found", or missing:
1. Check invitation token was sent
2. Verify GuardianSignup creation code in auth.controller.js
3. Check GuardianSignin creation in login function

---

## Summary

✅ **GuardianSignup** - Populated when invitation accepted + signup completed
✅ **GuardianSignin** - Populated when guardian logs in
✅ **Guardian APIs** - Now query GuardianSignup for autorization
✅ **Complete Flow** - Invitation → Signup → GuardianSignup → Login → GuardianSignin → Dashboard
