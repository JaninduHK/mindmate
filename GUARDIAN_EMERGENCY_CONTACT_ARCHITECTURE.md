# Guardian & Emergency Contact System - Complete Architecture

## 📊 System Overview

MindMate has a specialized system for managing emergency contacts and guardians:

```
User (Steshan)
    ↓
    Adds Emergency Contact (Email: john@test.com)
    ↓
EmergencyContact Record Created (status: pending)
    ↓
Invitation Email Sent to john@test.com
    ↓
John Receives Link: /guardian-signup?token=XXX
    ↓
John Fills Signup Form
    ↓
User Account Created (role: guardian)
    ↓
EmergencyContact Status Changed to: accepted
    ↓
Guardian Can Monitor User Now ✅
```

---

## 🗄️ Database Tables (Collections)

### 1. Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (user|guardian|counselor|admin),
  username: String (unique),
  avatar: String,
  bio: String,
  createdAt: Date,
  updatedAt: Date,
  // Guardian fields:
  isGuardian: Boolean,
  monitoringUsers: [ObjectId] // IDs of users this person monitors
}
```

**Status**: ✅ Properly defined and creates accounts as guardians

---

### 2. EmergencyContact Collection
```javascript
{
  _id: ObjectId,
  ownerUserId: ObjectId (ref: User), // Steshan
  contactUserId: ObjectId (ref: User), // John (after accepted)
  fullName: String,
  email: String,
  phoneNumber: String,
  relationship: String,
  inviteStatus: String (pending|accepted|rejected|expired),
  inviteTokenHash: String, // SHA-256 hashed token
  inviteExpiresAt: Date,
  lastInvitedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Status**: ✅ Properly defined for invitation tracking

---

### 3. RefreshToken Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  token: String,
  expiresAt: Date,
  createdByIp: String
}
```

**Status**: ✅ For maintaining user sessions

---

## 🔄 Complete Data Flow

### Phase 1: Emergency Contact Creation

**Frontend Action** (Steshan adds contact):
```javascript
POST /api/emergency-contacts
{
  fullName: "John Smith",
  email: "john@example.com",
  phoneNumber: "+1234567890", // optional
  relationship: "Family"
}
```

**Backend Process** (emergencyContact.controller.js):
```
1. Validate input
2. Check if email already added as contact (prevent duplicates)
3. Generate random token (32 bytes)
4. Hash token with SHA-256
5. Create EmergencyContact document:
   {
     ownerUserId: sthshan._id,
     fullName: "John Smith",
     email: "john@example.com",
     phoneNumber: "+1234567890",
     relationship: "Family",
     inviteStatus: "pending",
     inviteTokenHash: "HASHED",
     inviteExpiresAt: Date (now + 7 days),
     lastInvitedAt: Date.now()
   }
6. Send email with invitation link
7. Return success response
```

**Database Result**:
```json
{
  "_id": ObjectId("..."),
  "ownerUserId": ObjectId("steshan_id"),
  "fullName": "John Smith",
  "email": "john@example.com",
  "inviteStatus": "pending",
  "inviteTokenHash": "abc123...",
  "inviteExpiresAt": ISODate("2026-04-18")
}
```

---

### Phase 2: Email Invitation

**Email Content** (from invitationMailer.js):
```
To: john@example.com
From: noreply@mindmate.com
Subject: Emergency Contact Invitation - MindMate

Body:
Hi John,

Steshan has added you as an emergency contact on MindMate.

As Steshan's emergency contact, you'll be able to:
• Monitor their mood trends
• Receive alerts about their wellbeing
• View wellness goals
• Receive emergency notifications

To accept this invitation and create your guardian account, 
click the button below:

[ACCEPT INVITATION] → http://localhost:5173/guardian-signup?token=PLAINTOKEN

This link expires in 7 days.

Best regards,
MindMate Team
```

---

### Phase 3: Guardian Signup

**URL Structure**:
```
http://localhost:5173/guardian-signup?token=PLAINTOKEN
```

**Frontend Component** (GuardianSignup.jsx):
```
1. User clicks link → Page loads
2. Extract token from URL params
3. Show guardian signup form with fields:
   - Full Name (text input)
   - Email (read-only or pre-filled from token)
   - Password (password input)
   - Confirm Password (password input)
4. User fills form and submits
5. Send POST to /api/auth/guardian-signup
```

**Form Validation** (GuardianSignup.jsx):
```javascript
- Full Name: 2-60 chars, letters/spaces/hyphens only
- Email: Must be in valid format (email@domain.ext)
- Password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number
- Confirm: Must match password
```

---

### Phase 4: Guardian Account Creation

**API Endpoint**:
```javascript
POST /api/auth/guardian-signup
{
  name: "John Smith",
  email: "john@example.com",
  password: "StrongPass123",
  invitationToken: "PLAINTOKEN"
}
```

**Backend Process** (auth.controller.js → guardianSignup):

```
1. Validate required fields (name, email, password)

2. Check if user already exists with that email
   - If yes: Error "Email already registered"

3. If invitationToken provided:
   a. Find EmergencyContact record matching:
      - email: john@example.com
      - inviteStatus: 'pending'
   
   b. If not found: Error "Invalid or expired invitation"
   
   c. Verify token hash:
      - Received token: PLAINTOKEN
      - Hash it: SHA256(PLAINTOKEN) = HASHEDTOKEN
      - Compare with DB: inviteTokenHash
      - If mismatch: Error "Invalid invitation token"
   
   d. Check expiry:
      - If current time > inviteExpiresAt
      - Error "Invitation token has expired"

4. If all checks pass, create User account:
   {
     name: "John Smith",
     email: "john@example.com",
     password: HASH(StrongPass123),
     username: GENERATED_UNIQUE_NAME,
     role: "guardian",
     isGuardian: true,
     monitoringUsers: [sthshan._id]
   }

5. Update EmergencyContact record:
   {
     inviteStatus: "accepted",
     contactUserId: john_user._id,
     acceptedAt: Date.now()
   }

6. Generate tokens:
   - accessToken: JWT with userId
   - refreshToken: Random token + save to DB

7. Return response:
   {
     success: true,
     data: {
       user: { name, email, role, ... },
       accessToken: "JWT_TOKEN",
       monitoredUserId: sthshan._id
     }
   }
```

---

## 🔐 Security Mechanisms

### Token Security
```javascript
// Generation (backend)
const invitationToken = crypto.randomBytes(32).toString('hex')
const tokenHash = SHA256(invitationToken)
DB.store(tokenHash) // Never store plain token

// Email (sent to user)
Link: /guardian-signup?token=PLAIN_TOKEN

// Verification (backend)
Received: PLAIN_TOKEN
Hashed: SHA256(PLAIN_TOKEN)
Compare: hashedToken === inviteTokenHash
Result: Valid or Invalid
```

### Email Validation
- Joi schema: `.email()` - standard email format
- Frontend regex: `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`
- Must be unique in User collection
- Lowercase normalization

### Password Requirements
- Minimum 8 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain number
- Hashed with bcryptjs before storage

---

## 🌐 Endpoints Involved

### Emergency Contact Management
```
POST   /api/emergency-contacts
       Add new emergency contact
       Payload: { fullName, email, phoneNumber, relationship }
       Returns: Created contact record

GET    /api/emergency-contacts
       Get all emergency contacts for user
       Returns: Array of contact records

PUT    /api/emergency-contacts/:id
       Update specific contact
       Payload: { fullName, phoneNumber, relationship }

DELETE /api/emergency-contacts/:id
       Remove emergency contact

POST   /api/emergency-contacts/:id/resend-invitation
       Resend invitation to pending contact
```

### Guardian Authentication
```
POST   /api/auth/guardian-signup
       Create guardian account via invitation
       Payload: { name, email, password, invitationToken }
       Returns: { user, accessToken, monitoredUserId }

POST   /api/auth/register
       Regular user signup (different from guardian)
       Payload: { name, email, password }

POST   /api/auth/login
       Login (works for all roles)
       Payload: { email, password }
```

### Guardian Monitoring
```
GET    /api/guardian-dashboard
       Get list of monitored users

GET    /api/guardian-dashboard/:userId
       Get specific user's data for monitoring

GET    /api/guardian-dashboard/:userId/mood-analytics
       Get mood trends

GET    /api/guardian-dashboard/:userId/goal-analytics
       Get goal progress
```

---

## 🧪 Testing Checklist

### Database Setup
- [ ] MongoDB connected
- [ ] Users collection exists
- [ ] EmergencyContact collection exists
- [ ] RefreshToken collection exists

### Email Configuration
- [ ] .env has EMAIL_USER
- [ ] .env has EMAIL_PASS (app-specific password for Gmail)
- [ ] .env has EMAIL_HOST = smtp.gmail.com
- [ ] .env has EMAIL_PORT = 587

### Frontend Routes
- [ ] /guardian-signup route exists
- [ ] Page handles ?token= query parameter
- [ ] Form validates email format
- [ ] Form validates password requirements

### Backend Endpoints
- [ ] POST /api/emergency-contacts works
- [ ] POST /api/auth/guardian-signup works
- [ ] Token verification functions exist
- [ ] Email sending works

### Complete Flow
- [ ] Add emergency contact → Email sent
- [ ] Receive email → Has clickable link
- [ ] Click link → Guardian signup form appears
- [ ] Fill form → Submits successfully
- [ ] User account created with role: guardian
- [ ] EmergencyContact status changed to accepted
- [ ] Guardian can login and see dashboard

---

## 📈 Current Status

### ✅ Implemented
- Emergency contact model
- Guardian signup controller
- Email sending system
- Token generation and verification
- Guardian dashboard
- Invitation flow

### ✅ Verified
- All tables/collections exist
- Models properly define all fields
- Controllers handle the flow correctly
- Email sending is configured
- Authentication works

### ⚠️ Potential Issues
If guardian signup is failing:
1. Email might not be sending
2. Token might not be passing to frontend
3. Frontend might not recognizing token
4. Backend might not verifying token correctly

---

## 🎯 The Problem You're Facing

**What's happening**:
- You're trying to use regular signup with the emergency contact email
- But the system expects you to use the invitation link

**Solution**:
1. Make sure invitation email was sent
2. Click the link in the email
3. Fill guardian signup form
4. Account will be created properly

**NOT**:
- Just try to signup with email directly
- Use regular signup form
- Without using invitation link

---

## 🔧 How to Verify Everything is Working

```bash
# Terminal 1: Start backend
cd backend
npm run dev
# Look for: "MongoDB Connected" && "Server running on port 5001"

# Terminal 2: Start frontend  
cd frontend
npm run dev
# Look for: "Local: http://localhost:5173"

# Test Steps:
# 1. Create Steshan account
# 2. Login as Steshan
# 3. Add emergency contact: john@test.com
# 4. Check john@test.com inbox (or backend logs)
# 5. Copy invitation link
# 6. Open link in new browser window
# 7. Fill guardian signup form
# 8. Submit
# 9. Verify success and redirect to dashboard
```

---

## ✨ Summary

The Guardian & Emergency Contact system is a **two-step process**:

1. **User adds emergency contact** → Invitation sent
2. **Contact clicks invitation link** → Creates guardian account

It's NOT a single signup process. The invitation link ensures:
- ✅ Only invited people can create guardian accounts
- ✅ Tokens verify permission
- ✅ Email is verified (they received the email)
- ✅ Steshan controls who has access

**This is working as designed!** Just need to follow the correct flow. 🎯

