# Crisis System - Quick Start Guide

## 🎯 Start Here (5 Minutes)

### 1. Install Dependencies
```bash
cd backend
npm install zod nodemailer node-cron
npm install socket.io  # if not present
```

### 2. Copy Environment File
```bash
cp .env.example .env
```

### 3. Update Critical .env Values
```env
MOCK_EMAIL=true              # Use mock email in development
MOCK_SMS=true                # Use mock SMS in development
REQUIRE_EMERGENCY_CONTACT_ON_SIGNUP=false  # Don't enforce during signup
PUBLIC_EMERGENCY_NUMBER=119  # Your country's emergency number
INACTIVITY_DETECTION_THRESHOLD_HOURS=48
```

---

## 📚 Documentation Map

| Document | Purpose | Read Time |
|----------|---------|-----------|
| **CRISIS_SYSTEM_SUMMARY.md** | Overview of what's built (you are here) | 5 min |
| **CRISIS_SYSTEM_ARCHITECTURE.md** | Design decisions & file structure | 10 min |
| **CRISIS_SYSTEM_README.md** | Complete API documentation | 30 min |
| **IMPLEMENTATION_CHECKLIST.md** | Step-by-step code templates | 20 min |

---

## 🔄 Implementation Order

### Must Implement (In This Order)
1. **Services** - Business logic layer (follow `invitationService.js` pattern)
   - emergencyContactService
   - emergencyService
   - notificationService
   - contentService
   - emailService
   - smsService

2. **Controllers** - Request handlers (use service layer)
   - emergencyContact.controller.js
   - invitation.controller.js (invites endpoints)
   - emergency.controller.js
   - notification.controller.js
   - content.controller.js
   - dashboard.controller.js
   - settings.controller.js

3. **Routes** - API endpoints (wire controllers)
   - emergency-contacts.routes.js
   - invitations.routes.js
   - emergency.routes.js
   - notifications.routes.js
   - content.routes.js
   - dashboard.routes.js
   - settings.routes.js

4. **Middleware** - Cross-cutting concerns
   - rbac.middleware.js (role-based access)
   - ownership.middleware.js (resource ownership)

5. **Jobs** - Automated tasks
   - inactivityDetection.job.js
   - invitationExpiry.job.js

6. **Seeds** - Test data
   - contentResources.seed.js (15+ wellness resources)

---

## 💻 Copy-Paste Starter Code

### Emergency Contact Service Pattern
```javascript
// services/emergencyContactService.js
import EmergencyContact from '../models/EmergencyContact.model.js';
import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../config/constants.js';
import asyncHandler from '../utils/asyncHandler.js';
import { normalizePhoneNumber } from '../utils/phoneNormalizer.js';

class EmergencyContactService {
  async addEmergencyContact(ownerUserId, contactData) {
    // Check for duplicates
    const existing = await EmergencyContact.findOne({
      ownerUserId,
      email: contactData.email.toLowerCase(),
    });
    if (existing) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Contact already added');
    }

    // Create emergency contact
    const contact = await EmergencyContact.create({
      ownerUserId,
      fullName: contactData.fullName,
      email: contactData.email.toLowerCase(),
      phoneNumber: contactData.phoneNumber ? normalizePhoneNumber(contactData.phoneNumber) : null,
      relationship: contactData.relationship,
      isPrimarySignupContact: contactData.isPrimarySignupContact || false,
    });

    // TODO: Send invitation (use emailService + smsService)
    
    return contact;
  }

  async getEmergencyContacts(ownerUserId, filters = {}) {
    const query = { ownerUserId };
    
    if (filters.status) {
      query.inviteStatus = filters.status;
    }

    return await EmergencyContact.find(query)
      .sort(filters.sort || { createdAt: -1 })
      .lean();
  }

  async updateEmergencyContact(contactId, ownerUserId, updates) {
    const contact = await EmergencyContact.findById(contactId);
    
    if (!contact || contact.ownerUserId.toString() !== ownerUserId.toString()) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Contact not found');
    }

    Object.assign(contact, updates);
    await contact.save();
    return contact;
  }

  async deleteEmergencyContact(contactId, ownerUserId) {
    const contact = await EmergencyContact.findById(contactId);
    
    if (!contact || contact.ownerUserId.toString() !== ownerUserId.toString()) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Contact not found');
    }

    // TODO: Notify emergency contact they've been removed
    
    await EmergencyContact.findByIdAndDelete(contactId);
    return { message: 'Contact deleted' };
  }
}

export default new EmergencyContactService();
```

### Email Service Pattern
```javascript
// services/emailService.js
import nodemailer from 'nodemailer';
import { CRISIS_CONFIG } from '../config/crisis.config.js';

let transporter;

// Initialize based on config
if (CRISIS_CONFIG.FEATURES.MOCK_EMAIL) {
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('[MOCK EMAIL]', mailOptions.to, mailOptions.subject);
      return { messageId: 'mock-' + Date.now() };
    },
  };
} else {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

class EmailService {
  async sendMail(to, subject, html, text) {
    try {
      const result = await transporter.sendMail({
        from: CRISIS_CONFIG.COMMUNICATION.SENDER_EMAIL,
        to,
        subject,
        html,
        text,
      });
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email send failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendInvitationEmail(contact, ownerName, invitationUrl) {
    const { subject, html, text } = composeInvitationEmail(
      contact.fullName,
      ownerName,
      invitationUrl,
      contact.relationship
    );
    return this.sendMail(contact.email, subject, html, text);
  }
}

export default new EmailService();
```

### Controller Pattern
```javascript
// controllers/emergencyContact.controller.js
import emergencyContactService from '../services/emergencyContactService.js';
import asyncHandler from '../utils/asyncHandler.js';

export const createEmergencyContact = asyncHandler(async (req, res) => {
  const { fullName, email, phoneNumber, relationship, isPrimarySignupContact } = req.body;

  const contact = await emergencyContactService.addEmergencyContact(
    req.user._id,
    { fullName, email, phoneNumber, relationship, isPrimarySignupContact }
  );

  res.status(201).json({
    success: true,
    data: contact,
    message: 'Emergency contact added',
  });
});

export const getEmergencyContacts = asyncHandler(async (req, res) => {
  const contacts = await emergencyContactService.getEmergencyContacts(
    req.user._id,
    { status: req.query.status, sort: req.query.sort || '-createdAt' }
  );

  res.status(200).json({
    success: true,
    data: contacts,
  });
});

export const updateEmergencyContact = asyncHandler(async (req, res) => {
  const contact = await emergencyContactService.updateEmergencyContact(
    req.params.id,
    req.user._id,
    req.body
  );

  res.status(200).json({
    success: true,
    data: contact,
    message: 'Contact updated',
  });
});

export const deleteEmergencyContact = asyncHandler(async (req, res) => {
  await emergencyContactService.deleteEmergencyContact(req.params.id, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Contact deleted',
  });
});
```

### Route Pattern
```javascript
// routes/emergency-contacts.routes.js
import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { checkOwnership } from '../middlewares/ownership.middleware.js';
import {
  createEmergencyContact,
  getEmergencyContacts,
  updateEmergencyContact,
  deleteEmergencyContact,
  resendInvite,
} from '../controllers/emergencyContact.controller.js';

const router = express.Router();
router.use(verifyToken); // All routes require auth

router.get('/', getEmergencyContacts);
router.post('/', createEmergencyContact);
router.put('/:id', checkOwnership, updateEmergencyContact);
router.delete('/:id', checkOwnership, deleteEmergencyContact);
router.post('/:id/resend-invite', checkOwnership, resendInvite);

export default router;
```

### RBAC Middleware
```javascript
// middlewares/rbac.middleware.js
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../config/constants.js';

export const rbac = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'You do not have permission to access this resource'
      );
    }
    next();
  };
};
```

---

## 🚀 First Feature: Add Emergency Contact

### Step 1: Create Service
Create `services/emergencyContactService.js` using the pattern above

### Step 2: Create Controller
Create `controllers/emergencyContact.controller.js` using the pattern above

### Step 3: Create Routes
Create `routes/emergency-contacts.routes.js` using the pattern above

### Step 4: Update server.js
```javascript
import emergencyContactRoutes from './routes/emergency-contacts.routes.js';

// After other route registrations
app.use('/api/emergency-contacts', emergencyContactRoutes);
```

### Step 5: Test Endpoint
```bash
curl -X POST http://localhost:5000/api/emergency-contacts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "phoneNumber": "+94701234567",
    "relationship": "mother"
  }'
```

---

## 📋 Service Implementation Checklist

After implementing each service, test with this checklist:

**emergencyContactService**
- [ ] Add emergency contact (prevent duplicates)
- [ ] List contacts (with filtering & sorting)
- [ ] Update contact details
- [ ] Delete contact (prevent orphans)
- [ ] Get single contact

**emergencyService**
- [ ] Activate emergency mode (save location if provided)
- [ ] Deactivate emergency mode  
- [ ] Get emergency status
- [ ] Notify all contacts (email + SMS + dashboard)

**notificationService**
- [ ] Create notification
- [ ] List user notifications (with pagination)
- [ ] Mark as read
- [ ] Mark all as read
- [ ] Delete notification

**contentService**
- [ ] Get curated content (with filters)
- [ ] Get recommendations (based on risk score)
- [ ] Search content
- [ ] Rate content

**emailService**
- [ ] Send invitation email
- [ ] Send emergency alert email
- [ ] Send inactivity reminder email
- [ ] Handle mock email in development

**smsService**
- [ ] Send invitation SMS
- [ ] Send emergency alert SMS
- [ ] Handle SMS truncation
- [ ] Handle mock SMS in development

---

## 🧪 Test Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test -- emergency-contacts.test.js

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

---

## 🔍 Debugging Tips

### Check if models are registered
```javascript
// In MongoDB compass
// Should see collections:
// - users
// - emergencycontacts
// - contactinvitations
// - notifications
// - emergencysessions
// - contentresources
// - riskscores
```

### Verify token generation
```javascript
// Test in node REPL
import { generateInvitationToken, hashToken, verifyTokenHash } from './utils/tokenGenerator.js';

const token = generateInvitationToken();
const hash = hashToken(token);
const isValid = verifyTokenHash(token, hash);
console.log(isValid); // should be true
```

### Check email service
```javascript
// Test email composition
import { composeInvitationEmail } from './utils/invitationMailer.js';

const email = composeInvitationEmail(
  'Jane Doe',
  'John Doe',
  'https://mindmate.com/invite?token=abc123',
  'mother'
);
console.log(email);
```

---

## 💼 Production Checklist

Before deploying:
- [ ] All services implemented and tested
- [ ] All controllers created and working
- [ ] All routes wired and tested
- [ ] RBAC middleware working correctly
- [ ] Email service configured (not mocked)
- [ ] SMS service configured (not mocked)
- [ ] Scheduled jobs running
- [ ] Socket.io handlers in place
- [ ] Content resources seeded
- [ ] Rate limiting enabled
- [ ] Error logging enabled
- [ ] Audit logging enabled
- [ ] HTTPS enabled
- [ ] CORS configured properly
- [ ] Database backups enabled

---

## 📞 Quick Troubleshooting

### "Token validation failed"
- Check if `tokenHash` is being selected with `.select('+tokenHash')`
- Verify token wasn't already used or expired

### "Emergency contact not sending email"
- Check `MOCK_EMAIL` env var
- Verify `EMAIL_USER` and `EMAIL_PASS` if using real email
- Check server logs for send failures

### "RBAC denying access"
- Verify user.role is set correctly
- Emergency-contact users need `role: 'emergency_contact'`
- Check middleware is applied to route

### "Location not saving"
- Verify `location` object has `lat` and `lng` as numbers
- Check `isValidCoordinates()` validation passes
- Ensure coordinates are within valid ranges (-90 to 90, -180 to 180)

---

## 🎓 Next Learning Steps

1. **Implement one service** - Start with `emergencyContactService`
2. **Build its controller** - Follow the pattern provided
3. **Create its routes** - Wire everything together
4. **Test end-to-end** - Verify the API works
5. **Repeat for each service** - You'll get faster with practice

---

## 📖 Reference Documentation

- [Mongoose Guide](https://mongoosejs.com/) - Data modeling
- [Express.js Guide](https://expressjs.com/) - Web framework
- [Zod Docs](https://zod.dev/) - Input validation
- [Socket.IO Guide](https://socket.io/docs/) - Real-time communication
- [Node-cron Docs](https://github.com/kelektiv/node-cron) - Job scheduling

---

**You've got this! Start with the first service and work your way through. Reference the patterns and you'll have the complete system built in no time.** 🚀

---

**Questions?** Check the comprehensive CRISIS_SYSTEM_README.md for detailed API specifications and integration examples.
