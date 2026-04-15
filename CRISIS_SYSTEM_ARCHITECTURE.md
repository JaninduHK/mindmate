# Crisis Detection & Emergency Response System - Backend Architecture

## Proposed File Structure

```
backend/
├── config/
│   ├── crisis.config.js          [Crisis system constants & defaults]
│   └── [existing files remain]
├── models/
│   ├── User.model.js            [UPDATE: add emergency contact fields]
│   ├── EmergencyContact.model.js [NEW]
│   ├── ContactInvitation.model.js[NEW]
│   ├── Notification.model.js     [UPDATE or new]
│   ├── EmergencySession.model.js [NEW]
│   ├── ContentResource.model.js  [NEW]
│   ├── RiskScore.model.js        [NEW if not exists]
│   └── [existing models remain]
├── controllers/
│   ├── auth.controller.js        [UPDATE: register with initial contact]
│   ├── emergencyContact.controller.js [NEW]
│   ├── invitation.controller.js  [NEW]
│   ├── notification.controller.js[NEW or UPDATE]
│   ├── emergency.controller.js   [NEW - emergency activation/deactivation]
│   ├── settings.controller.js    [NEW - user preferences]
│   ├── content.controller.js     [NEW - content recommendations]
│   ├── dashboard.controller.js   [NEW - user & guardian dashboards]
│   └── [existing controllers remain]
├── routes/
│   ├── emergency-contacts.routes.js   [NEW]
│   ├── invitations.routes.js          [NEW]
│   ├── notifications.routes.js        [NEW or UPDATE]
│   ├── emergency.routes.js            [NEW]
│   ├── settings.routes.js             [NEW]
│   ├── content.routes.js              [NEW]
│   ├── dashboard.routes.js            [NEW]
│   ├── auth.routes.js                 [UPDATE: register endpoint]
│   └── [existing routes remain]
├── services/
│   ├── authService.js           [UPDATE: handle initial emergency contact]
│   ├── emergencyContactService.js[NEW]
│   ├── invitationService.js      [NEW]
│   ├── notificationService.js    [NEW or UPDATE]
│   ├── emergencyService.js       [NEW]
│   ├── contentService.js         [NEW]
│   ├── riskSummaryService.js     [NEW]
│   ├── emailService.js           [UPDATE or new SMS/email abstraction]
│   ├── smsService.js             [NEW - abstraction layer]
│   ├── socketService.js          [NEW - Socket.IO wrapper]
│   ├── auditLogService.js        [NEW]
│   └── [existing services remain]
├── middlewares/
│   ├── rbac.middleware.js        [NEW - role-based access control]
│   ├── ownership.middleware.js   [NEW - verify resource ownership]
│   ├── errorHandler.middleware.js[UPDATE if needed]
│   ├── auth.middleware.js        [UPDATE: ensure compatibility]
│   └── [existing middlewares remain]
├── validators/
│   ├── emergency.validators.js   [NEW]
│   ├── invitation.validators.js  [NEW]
│   ├── contact.validators.js     [NEW]
│   └── [existing validators remain]
├── jobs/
│   ├── inactivityDetection.job.js[NEW - node-cron scheduler]
│   ├── invitationExpiry.job.js   [NEW - cleanup expired invites]
│   └── emergencySessionCleanup.job.js [NEW - archive old sessions]
├── socket/
│   ├── emergencySocket.handler.js[NEW - Socket.IO events for emergency]
│   └── [existing socket handlers remain]
├── utils/
│   ├── tokenGenerator.js         [NEW - generate invite tokens]
│   ├── locationUtils.js          [NEW - sanitize, validate location]
│   ├── phoneNormalizer.js        [NEW - E.164 + local formats]
│   ├── invitationMailer.js       [NEW - compose invite emails]
│   ├── smsBodies.js              [NEW - compose SMS messages]
│   ├── errorMessages.js          [UPDATE - add crisis-specific messages]
│   └── [existing utils remain]
├── constants/
│   ├── crisis.constants.js       [NEW - enums, statuses]
│   ├── relationships.js          [NEW - emergency contact relationships]
│   └── [existing constants]
├── seeds/
│   ├── contentResources.seed.js  [NEW - 15+ sample resources]
│   └── testData.seed.js          [NEW - test emergency contacts]
├── tests/
│   ├── emergency-contacts.test.js[NEW]
│   ├── invitations.test.js       [NEW]
│   ├── emergency-activation.test.js [NEW]
│   ├── guardian-dashboard.test.js[NEW]
│   └── [existing tests remain]
├── .env.example                  [UPDATE - add crisis variables]
├── .env                          [existing]
├── server.js                     [UPDATE - register jobs & sockets]
├── README.md                     [UPDATE - add crisis system docs]
└── package.json                  [UPDATE - add needed dependencies]
```

## New Dependencies to Add

```json
{
  "dependencies": {
    "zod": "^3.x",                    // or joi (use existing if present)
    "nodemailer": "^x.x",             // if not present
    "twilio": "^4.x",                 // optional; we'll mock if not configured
    "node-cron": "^3.x",              // inactivity detection job
    "bullmq": "^x.x",                 // optional: alternative to cron
    "socket.io": "^x.x"               // if not present
  }
}
```

## Key Design Decisions

1. **Invitation Token Strategy**
   - Hash tokens at rest, compare on accept
   - 7-day expiry default
   - Single-use enforcement via status tracking
   - Support both new account and existing account linking

2. **RBAC Approach**
   - Middleware-based role checks
   - Ownership checks for linked-user data
   - Emergency contacts can ONLY see limited guardian view

3. **Location Handling**
   - GPS/location ONLY saved after emergency mode activated + GPS enabled
   - Coordinates sanitized (no precise logs)
   - Maps URL generated server-side, not passed around

4. **Notification Architecture**
   - Separate notify calls for primary user (supportive wording) and emergency contacts (direct alerts)
   - Socket.IO for real-time dashboard updates
   - Email/SMS for critical alerts (emergency activation)

5. **Content Recommendation**
   - Risk score + mood + goal-based filtering
   - Curated seed data for production
   - Safe search link generation (no scraping)

6. **Inactivity Job**
   - Uses node-cron (simple, no external job queue needed)
   - Configurable thresholds via env
   - Gentle reminder to primary user; alert to contacts only by policy

7. **Error Handling**
   - Partial success returns (e.g., "signup OK, but invite failed")
   - Never crash on email/SMS failure
   - Audit log all failures for retry/debug

8. **Testing Strategy**
   - Jest + Supertest
   - Mock email/SMS in test env
   - Integration tests for full flows
   - RBAC tests to ensure contacts can't access private data

---

Next: I will implement all models, controllers, services, routes, and configuration.
