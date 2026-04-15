# Crisis Detection & Emergency Response System - Implementation Guide

## Overview

This is a production-ready backend module for a wellness MERN application that enables:
- Emergency contact management and invitations
- Emergency mode activation with real-time alerts
- Inactivity detection and reminders
- Guardian/emergency-contact dashboard access
- Role-based access control (RBAC)
- Content recommendations for crisis support
- Email and SMS alerts

## ⚡ Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install

# New packages to add for crisis system:
npm install zod bcryptjs nodemailer node-cron

# Optional but recommended:
npm install twilio         # For SMS (we provide mock fallback)
npm install socket.io      # For real-time alerts (likely already installed)
npm install bullmq         # For advanced job queuing (optional)
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

**Critical variables** for crisis system:
```
REQUIRE_EMERGENCY_CONTACT_ON_SIGNUP=false           # Don't block signup in dev
MOCK_EMAIL=true                                      # Use mock email in dev
MOCK_SMS=true                                        # Use mock SMS in dev
PUBLIC_EMERGENCY_NUMBER=119                          # Your country's emergency
PUBLIC_CRISIS_HOTLINE_NUMBER=1234                   # Mental health crisis line
INACTIVITY_DETECTION_THRESHOLD_HOURS=48             # When to notify
```

### 3. Database Seeds

Add dummy content resources and test data:

```bash
npm run seed:content      # Populates ContentResource collection with 15+ wellness videos/articles
npm run seed:testcontacts # Creates test emergency contacts (optional)
```

### 4. Start the Server

```bash
npm run dev    # Development with nodemon
npm start      # Production
```

The server will initialize:
- ✅ Database connection
- ✅ Scheduled jobs (inactivity detection, invite expiry cleanup)
- ✅ Socket.IO listeners for emergency alerts
- ✅ Email/SMS service (mock or real based on config)

---

## 📋 Database Models

### User (Extended)
Added fields for crisis system:
```javascript
{
  // Existing fields
  name, email, password, role, ...

  // New fields
  phoneNumber: String,
  linkedUsers: [ObjectId],           // For emergency_contact role
  preferences: {
    gpsEnabled: Boolean,
    alertChannels: {
      email: Boolean,
      sms: Boolean
    }
  },
  lastActiveAt: Date,
  isEmergencyModeActive: Boolean,
  emergencyModeActivatedAt: Date
}
```

### EmergencyContact
Related emergency contact with invite tracking:
```javascript
{
  ownerUserId: ObjectId,             // The user who added this contact
  contactUserId: ObjectId,           // Null until invited person creates account
  fullName: String,                  // Contact's name
  email: String,
  phoneNumber: String,
  relationship: Enum,                // sister, brother, mother, father, partner, therapist, friend, other
  inviteStatus: Enum,                // pending, accepted, expired, revoked, failed
  inviteTokenHash: String,
  inviteExpiresAt: Date,
  deliveryStatus: {
    email: Enum,                     // queued, sent, failed, skipped
    sms: Enum
  },
  isPrimarySignupContact: Boolean,
  lastInvitedAt: Date
}
```

### ContactInvitation
Audit trail for invitations:
```javascript
{
  ownerUserId: ObjectId,
  emergencyContactId: ObjectId,
  tokenHash: String,
  expiresAt: Date,
  acceptedAt: Date,
  status: Enum,
  channelsAttempted: { email: Boolean, sms: Boolean },
  deliveryResult: { email: {...}, sms: {...} },
  failureReason: String
}
```

### Notification
Extended for crisis alerts:
```javascript
{
  recipientUserId: ObjectId,
  relatedUserId: ObjectId,           // For emergency-contact filtering
  type: Enum,                        // inactivity, content_suggestion, etc.
  severity: Enum,                    // info, warning, emergency
  title: String,
  message: String,
  metadata: {                        // Crisis-specific metadata
    emergencySessionId: ObjectId,
    location: { lat, lng, accuracy },
    mapsUrl: String,
    ...
  },
  readAt: Date
}
```

### EmergencySession
Active emergency mode tracking:
```javascript
{
  ownerUserId: ObjectId,
  isActive: Boolean,
  activatedAt: Date,
  deactivatedAt: Date,
  activatedLocation: {
    lat: Number,
    lng: Number,
    accuracy: Number,
    source: String,                  // gps, manual, network
    mapsUrl: String
  },
  contactSnapshot: [{ contactId, fullName, email, ... }],
  sentChannels: { email: Number, sms: Number, dashboard: Number },
  acknowledgedByContacts: [{ contactUserId, acknowledgedAt }]
}
```

### ContentResource
Curated wellness content:
```javascript
{
  title: String,
  type: Enum,                        // video, article, audio, story
  description: String,
  thumbnailUrl: String,
  externalUrl: String,
  durationText: String,
  riskLevel: Enum,                   // low, medium, high
  moods: [String],
  goals: [String],
  tags: [String],
  isCurated: Boolean,
  isActive: Boolean,
  viewCount: Number,
  ratingSum: Number,
  ratingCount: Number
}
```

### RiskScore
User risk assessment:
```javascript
{
  userId: ObjectId,
  score: Number,                     // 0-100
  level: Enum,                       // low, medium, high, critical
  factors: {
    moodTrend: String,
    inactivityHours: Number,
    recentMoodEntries: Number,
    goalProgress: String
  },
  source: Enum,                      // automated, manual, assessment
  expiresAt: Date                    // Auto-delete after expiry
}
```

---

## 🔌 API Endpoints

### Authentication & Invitations

#### **POST `/api/auth/register`**
Register a new user with optional initial emergency contact.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phoneNumber": "+94701234567",
  "initialEmergencyContact": {
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "phoneNumber": "+94771234567",
    "relationship": "mother"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "name": "John Doe", "role": "user", ... },
    "accessToken": "eyJhbGc...",
    "invitationStatus": {
      "created": true,
      "emailSent": true,
      "smsSent": false,
      "deliveryErrors": []
    }
  },
  "message": "User registered successfully. Emergency contact invited."
}
```

**Error Response (if initial contact fails):**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "...",
    "invitationStatus": {
      "created": true,
      "emailSent": false,
      "smsSent": false,
      "deliveryErrors": ["Failed to send email"]
    }
  },
  "message": "Account created, but invitation could not be sent. Try resending later."
}
```

---

#### **GET `/api/invitations/:token/validate`**
Validate an invitation token without accepting.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "expiresAt": "2024-04-14T10:30:00Z",
    "ownerUser": {
      "_id": "...",
      "name": "John Doe"
    },
    "emergencyContact": {
      "_id": "...",
      "fullName": "Jane Doe",
      "relationship": "mother"
    },
    "canLinkExistingAccount": true
  }
}
```

---

#### **POST `/api/invitations/:token/accept-register`**
Accept invitation and create new emergency_contact account.

**Request:**
```json
{
  "fullName": "Jane Doe",
  "password": "SecurePass123!",
  "phoneNumber": "+94771234567"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "role": "emergency_contact",
      "linkedUsers": ["userId_of_inviter"]
    },
    "accessToken": "eyJhbGc..."
  },
  "message": "Account created and invitation accepted"
}
```

---

#### **POST `/api/invitations/:token/accept-existing-account`**
Accept invitation with existing emergency_contact account.

**Request:**
```json
{}
```
(Uses JWT auth from logged-in user)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "linkedUsers": ["...existing...", "...new inviter..."]
    }
  },
  "message": "Invitation accepted and account linked"
}
```

---

### Emergency Contacts Management

#### **GET `/api/emergency-contacts`**
List all emergency contacts for the authenticated user.

**Query Parameters:**
- `status`: Filter by invite status (pending, accepted, expired)
- `sort`: -createdAt (default), fullName, relationship

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "relationship": "mother",
      "inviteStatus": "accepted",
      "isPrimarySignupContact": true,
      "createdAt": "2024-04-07T10:00:00Z"
    }
  ]
}
```

---

#### **POST `/api/emergency-contacts`**
Add a new emergency contact.

**Request:**
```json
{
  "fullName": "Dr. Smith",
  "email": "dr.smith@example.com",
  "phoneNumber": "+94701234567",
  "relationship": "therapist"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "emergencyContact": { ... },
    "invitationSent": {
      "email": { "success": true, "sentAt": "2024-04-07T10:00:00Z" },
      "sms": { "success": false, "error": "SMS disabled by user" }
    }
  },
  "message": "Emergency contact added and invitation sent"
}
```

---

#### **PUT `/api/emergency-contacts/:id`**
Update an emergency contact.

**Request:**
```json
{
  "fullName": "Dr. Smith",
  "phoneNumber": "+94771234567",
  "relationship": "therapist"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Emergency contact updated"
}
```

---

#### **DELETE `/api/emergency-contacts/:id`**
Delete an emergency contact.

**Response (200):**
```json
{
  "success": true,
  "message": "Emergency contact deleted and removed from notifications"
}
```

---

#### **POST `/api/emergency-contacts/:id/resend-invite`**
Resend invitation to an emergency contact.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "invitationSent": { ... },
    "newExpiresAt": "2024-04-14T10:30:00Z"
  },
  "message": "Invitation resent successfully"
}
```

---

### Settings & Preferences

#### **GET `/api/settings/preferences`**
Get user alert preferences.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "gpsEnabled": true,
    "alertChannels": {
      "email": true,
      "sms": false
    }
  }
}
```

---

#### **PATCH `/api/settings/preferences`**
Update user alert preferences.

**Request:**
```json
{
  "gpsEnabled": true,
  "alertChannels": {
    "email": true,
    "sms": true
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Preferences updated"
}
```

---

### Notifications

#### **GET `/api/notifications`**
Get user notifications (supports pagination & filtering).

**Query Parameters:**
- `type`: Filter by notification type
- `severity`: info, warning, emergency
- `unread`: true|false
- `limit`: 20 (default)
- `skip`: 0 (default)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "type": "emergency_activated",
      "severity": "emergency",
      "title": "Emergency Mode Activated",
      "message": "John has activated emergency mode",
      "readAt": null,
      "createdAt": "2024-04-07T10:30:00Z"
    }
  ],
  "metadata": {
    "total": 5,
    "unreadCount": 2
  }
}
```

---

#### **PATCH `/api/notifications/:id/read`**
Mark a single notification as read.

**Response (200):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Notification marked as read"
}
```

---

#### **PATCH `/api/notifications/read-all`**
Mark all notifications as read.

**Response (200):**
```json
{
  "success": true,
  "data": { "modifiedCount": 5 },
  "message": "All notifications marked as read"
}
```

---

### Emergency Mode

#### **GET `/api/emergency/status`**
Get current emergency mode status.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "isActive": false,
    "activatedAt": null,
    "activeSession": null
  }
}
```

---

#### **POST `/api/emergency/activate`**
Activate emergency mode.

**Request:**
```json
{
  "location": {
    "lat": 6.9271,
    "lng": 80.7744,
    "accuracy": 15,
    "source": "gps"
  },
  "note": "Having a panic attack, need immediate support"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "session": {
      "_id": "...",
      "isActive": true,
      "activatedAt": "2024-04-07T10:30:00Z",
      "activatedLocation": { ... },
      "mapsUrl": "https://maps.google.com/?q=6.93,80.77"
    },
    "alertsSent": {
      "email": 2,
      "sms": 1,
      "dashboard": 3
    }
  },
  "message": "Emergency mode activated. Contacts have been notified."
}
```

---

#### **POST `/api/emergency/deactivate`**
Deactivate emergency mode.

**Request:**
```json
{
  "resolutionNote": "Feeling better now, thank you for the support"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "deactivatedAt": "2024-04-07T11:00:00Z"
  },
  "message": "Emergency mode deactivated"
}
```

---

### Content & Recommendations

#### **GET `/api/content`**
Get curated content (with optional filters).

**Query Parameters:**
- `type`: video, article, audio, story
- `riskLevel`: low, medium, high
- `mood`: anxiety, depression, stress, etc.
- `goal`: goal_id
- `limit`: 10
- `skip`: 0

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "5-Minute Breathing Exercise",
      "type": "video",
      "description": "Calm your nervous system in 5 minutes",
      "thumbnailUrl": "...",
      "externalUrl": "...",
      "durationText": "5:00",
      "riskLevel": "high",
      "moods": ["anxiety", "panic"],
      "tags": ["breathing", "quick", "grounding"]
    }
  ]
}
```

---

#### **GET `/api/content/recommendations`**
Get content recommendations based on user's risk score and mood.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "riskLevel": "medium",
    "currentMoods": ["stress", "overwhelm"],
    "recommendedContent": [
      {
        "_id": "...",
        "title": "...",
        "priority": 1,
        "reason": "Matches your current stress level"
      }
    ]
  }
}
```

---

#### **GET `/api/content/search-links`**
Get safe search links for wellness-related queries.

**Query Parameters:**
- `query`: Search term (e.g., "anxiety relief", "coping skills")
- `source`: google, bing, duckduckgo

**Response (200):**
```json
{
  "success": true,
  "data": {
    "query": "anxiety relief",
    "links": [
      {
        "title": "Search: anxiety relief",
        "url": "https://www.google.com/search?q=anxiety+relief+mindfulness"
      }
    ],
    "warning": "Always verify sources before using health information"
  }
}
```

---

### Dashboard

#### **GET `/api/dashboard/summary`**
Get user's personal dashboard summary.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "name": "John Doe" },
    "riskLevel": "medium",
    "riskScore": 45,
    "lastMoodEntry": { "date": "2024-04-07", "mood": "stressed" },
    "recommendedContent": [...],
    "emergencyContactCount": 3,
    "pendingInvitations": 1
  }
}
```

---

#### **GET `/api/guardian/linked-users`**
Get list of primary users linked to this emergency-contact account.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "John Doe",
      "isEmergencyModeActive": false,
      "lastActiveAt": "2024-04-07T09:45:00Z",
      "riskLevel": "low"
    }
  ]
}
```

---

#### **GET `/api/guardian/users/:userId/summary`**
Get summary of a specific primary user (for emergency contact dashboard).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "isEmergencyModeActive": false
    },
    "riskLevel": "medium",
    "riskScore": 45,
    "lastActiveAt": "2024-04-07T09:45:00Z",
    "lastEmergencyActivation": "2024-04-06T14:30:00Z",
    "emergencyContacts": 3
  }
}
```

---

#### **GET `/api/guardian/users/:userId/notifications`**
Get notifications for a specific primary user (emergency contact view).

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "type": "emergency_activated",
      "severity": "emergency",
      "title": "Emergency Mode Activated",
      "createdAt": "2024-04-07T10:30:00Z"
    }
  ]
}
```

---

## 🔧 Core Services

### invitationService
- `createInvitation(ownerUserId, emergencyContactId)`
- `validateToken(token)`
- `acceptInvitationNewAccount(token, contactData)`
- `acceptInvitationExistingAccount(token, userId)`
- `revokeInvitation(invitationId)`
- `cleanupExpiredInvitations()`

### emergencyContactService
- `addEmergencyContact(ownerUserId, contactData)`
- `getEmergencyContacts(ownerUserId, filters)`
- `updateEmergencyContact(contactId, updates)`
- `deleteEmergencyContact(contactId)`
- `getContactById(contactId)`

### emergencyService
- `activateEmergencyMode(userId, location, note)`
- `deactivateEmergencyMode(userId, resolutionNote)`
- `getEmergencyStatus(userId)`
- `notifyAllContacts(session)`

### notificationService
- `createNotification(recipientUserId, type, message, metadata)`
- `getUserNotifications(userId, filters, pagination)`
- `markAsRead(notificationId)`
- `markAllAsRead(userId)`
- `deleteNotification(notificationId)`

### contentService
- `getContent(filters, pagination)`
- `getRecommendations(userId)`
- `searchContent(query, filters)`

### emailService
- `sendMail(to, subject, html, text)`
- `sendInvitationEmail(contact, ownerName, invitationUrl)`
- `sendEmergencyAlert(contacts, primaryUserName, mapsUrl, emergencyNumber)`

### smsService
- `sendSMS(phoneNumber, message)`
- `sendInvitationSMS(phoneNumber, ownerName, invitationUrl)`
- `sendEmergencyAlertSMS(phoneNumber, primaryUserName, mapsUrl)`

---

## 🛡️ Security & RBAC

### Middleware

**authMiddleware**
- Verifies JWT token
- Populates req.user

**rbacMiddleware**
- Checks user.role against required roles
- Example: `rbac('emergency_contact', 'admin')`

**ownershipMiddleware**
- Verifies user owns the resource
- Prevents accessing other users' data

**emergencyContactGuardMiddleware**
- Extra validation for emergency_contact role users
- Ensures they can only access linked primary users

### RBAC Rules

**user** (primary user)
- ✅ Manage own emergency contacts
- ✅ Activate/deactivate emergency mode
- ✅ View own dashboard
- ✅ Manage own preferences
- ❌ Access emergency_contact routes

**emergency_contact**
- ✅ View guardian dashboard
- ✅ See notifications for linked primary users
- ✅ View linked primary users' summaries
- ✅ Manage own preferences
- ❌ Activate emergency mode on behalf of primary user
- ❌ Modify emergency contacts (only primary user can manage those)
- ❌ Access private journals/notes (not exposed in this module)

**admin**
- ✅ Full access to all resources
- ✅ View system statistics
- ✅ Manage content resources

---

## 📅 Scheduled Jobs

### Inactivity Detection (`jobs/inactivityDetection.job.js`)
- **Runs**: Every hour (configurable)
- **Threshold**: 48 hours by default
- **Action**: 
  - Notifies primary user gently
  - After 72 hours, alerts emergency contacts
- **Env var**: `INACTIVITY_DETECTION_THRESHOLD_HOURS`

### Invitation Expiry Cleanup (`jobs/invitationExpiry.job.js`)
- **Runs**: Daily at 2 AM
- **Action**: Marks expired invitations and updates emergency contact status

---

## 🧪 Testing

Run tests with:
```bash
npm test
```

Coverage includes:
- ✅ Signup with initial emergency contact
- ✅ Contact CRUD
- ✅ Invitation validation and acceptance
- ✅ RBAC enforcement
- ✅ Emergency activation with location
- ✅ Emergency deactivation
- ✅ Guardian dashboard access
- ✅ Notification filtering

---

## 📊 Seed Data

### Content Resources Seed
```bash
npm run seed:content
```

Creates 15+ sample resources:
- 5 videos (4-10 minutes)
- 5 articles (3-8 min read)
- 3 audio tracks (5-15 minutes)
- 2 stories/case studies

Categorized by risk level and mood tags.

---

## ⚙️ Configuration

### Email (Development)
By default, emails are logged to console. To test with real SMTP:
1. Set `MOCK_EMAIL=false`
2. Configure `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`

### SMS (Development)
By default, SMS is mocked. To use Twilio:
1. Set `MOCK_SMS=false`
2. Configure Twilio credentials

### Location Handling
- GPS precision limited to 4 decimal places (~11m accuracy)
- Coordinates redacted in logs (2 decimal places)
- Never log maps URLs with precise coordinates

---

## 🚨 Common Issues & Solutions

### Emergency contact invite not sending
- Check `MOCK_EMAIL` and `MOCK_SMS` settings
- Verify `EMAIL_FROM` is set correctly
- Check server logs for delivery errors

### Emergency mode not notifying contacts
- Ensure contacts have `inviteStatus === 'accepted'`
- Check if `alertChannels` are enabled in user preferences
- Verify email/SMS configuration

### Inactivity detection not working
- Check if cron job is running in logs
- Verify `INACTIVITY_DETECTION_THRESHOLD_HOURS`
- Check if `lastActiveAt` is being updated

### Authorization failures
- Common: Emergency-contact trying to access primary user endpoints
- Solution: Use guardian-specific routes instead

---

## 📚 Additional Resources

- [Zod Validation Docs](https://zod.dev/)
- [Mongoose Schemas](https://mongoosejs.com/docs/guide.html)
- [Socket.io Documentation](https://socket.io/docs/)
- [Node-cron Guide](https://www.npmjs.com/package/node-cron)
- [Twilio SMS API](https://www.twilio.com/docs/sms)

---

## 🔄 Integration with Existing App

### Extend User Model (Already Done)
```javascript
// User.model.js - Emergency contact fields added
phoneNumber, linkedUsers, preferences, lastActiveAt, isEmergencyModeActive, emergencyModeActivatedAt
```

### Update Auth Controller
```javascript
// authService.js now handles initialEmergencyContact in register flow
```

### Add Routes to `server.js`
```javascript
app.use('/api/emergency-contacts', emergencyContactRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
```

### Initialize Scheduled Jobs
```javascript
// In server.js after DB connection
import { initializeScheduledJobs } from './jobs/index.js';
initializeScheduledJobs();
```

### Initialize Socket.io Handlers
```javascript
// In server.js after Socket.io setup
import emergencySocketHandler from './socket/emergencySocket.handler.js';
emergencySocketHandler(io);
```

---

## 📞 Support

For questions or issues:
1. Check logs: `npm run logs` or terminal output
2. Review .env configuration
3. Check database connection status
4. Verify all models are properly indexed

---

**Version**: 1.0.0  
**Last Updated**: April 2024  
**Status**: Production Ready
