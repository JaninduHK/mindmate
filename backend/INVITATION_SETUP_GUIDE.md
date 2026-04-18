# Emergency Contact Invitation System - Setup Guide

## Overview
The system now sends email and SMS invitations to emergency contacts when they are added. This guide walks you through setting it up.

## 1. Email Setup (Gmail - Already Configured)

### Current Status
Email is already configured in your `.env`:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Steps to Enable Email:
1. Go to [Google Account Security Settings](https://myaccount.google.com/security)
2. Enable "2-Step Verification"
3. Go to [App Passwords](https://myaccount.google.com/apppasswords) (select Mail & Windows)
4. Copy the 16-character app password
5. Update your `.env`:
   ```
   EMAIL_USER=your_gmail@gmail.com
   EMAIL_PASS=xxxx xxxx xxxx xxxx
   ```
6. Restart the server

**Test Email Sending:**
```bash
node test-send-invitation.js
```

---

## 2. SMS Setup (Twilio - Optional)

### Get a Twilio Account:
1. Visit [Twilio.com](https://www.twilio.com)
2. Sign up for a free account
3. Get your Twilio Phone Number (e.g., +1234567890)

### Find Your Credentials:
1. Go to [Twilio Console](https://console.twilio.com)
2. Find your **Account SID** and **Auth Token** in the dashboard
3. Get your Twilio Phone Number

### Update `.env`:
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### Install Twilio:
```bash
cd backend
npm install twilio
```

### Restart Server:
```bash
npm run dev
```

---

## 3. How It Works

### When Adding an Emergency Contact:
1. User provides: Name, Email, Phone Number (optional), Relationship
2. System generates an **invitation token** (7-day expiry)
3. **Email is sent** with invitation link
4. **SMS is sent** (if phone number provided)
5. Contact record saved with delivery status

### Invitation Link Format:
```
http://localhost:3000/guardian/signup?token=INVITATION_TOKEN
```

The token is used to:
- Pre-fill the email on signup form
- Auto-link the account when verified
- Prevent unauthorized signup

### Contact Flow:
1. Contact receives email/SMS
2. Clicks link → redirected to `http://localhost:3000/guardian/signup?token=XXX`
3. Signs up with the pre-filled email
4. Account is automatically linked to the monitored user
5. Can see Guardian Dashboard

---

## 4. Testing

### Test Script:
```bash
cd backend
node test-send-invitation.js
```

This will:
1. Find or create a test contact for Jerome
2. Generate an invitation token
3. Send test email (to configured EMAIL_USER)
4. Send test SMS (logs to console if Twilio not configured)
5. Display invitation link

### Manual Testing:
```bash
curl -X POST http://localhost:5001/api/emergency-contacts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jerome Samaratunge",
    "email": "steshansamaratunge@aiesec.net",
    "phoneNumber": "+94772345678",
    "relationship": "friend"
  }'
```

---

## 5. Testing Without Real Email/SMS

### Mock Mode (Development):
The system automatically falls back to logging if credentials aren't configured:
- **Email**: Logs to console if EMAIL_USER not set
- **SMS**: Logs to console if TWILIO_ACCOUNT_SID not set

This is perfect for development!

### Test with Real Email:
Add real credentials to `.env`:
```
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password
```

Check your Gmail inbox for the invitation email.

---

## 6. Frontend Integration

### Guardian Signup Page (`/guardian/signup`):
1. Accept `token` query parameter
2. Pre-fill email from token
3. Submit form with token in body
4. Backend validates token and links account

### Example Frontend Logic:
```javascript
// Extract token from URL
const token = new URLSearchParams(window.location.search).get('token');

// Pre-fill email in form
if (token) {
  // The backend will validate and link the account
}

// On signup submit
const response = await fetch('/api/auth/guardian-signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email,
    password,
    fullName,
    phoneNumber,
    invitationToken: token,
  })
});
```

---

## 7. Troubleshooting

### Email Not Sending:
1. Check `.env` has EMAIL_USER and EMAIL_PASS
2. Run: `node test-send-invitation.js`
3. Check console for errors
4. Ensure Gmail app password (not regular password) is used
5. Check if "Less secure app access" is needed

### SMS Not Sending:
1. Install Twilio: `npm install twilio`
2. Verify TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in `.env`
3. Ensure TWILIO_PHONE_NUMBER is in E.164 format: `+1234567890`
4. Test phone number is real and can receive SMS

### Invitation Link Not Working:
1. Ensure CLIENT_URL in `.env` matches your frontend URL
2. Check token is being passed in query parameter
3. Verify token hasn't expired (7 days)
4. Test with: `node test-send-invitation.js`

---

## 8. Deployment

### For Production:
1. **Email**: Set real Gmail app password in `.env`
2. **SMS**: Add Twilio credentials to `.env` (or skip for email-only)
3. **CLIENT_URL**: Set to your production frontend URL
4. Deploy and restart server

### Environment Variables Needed:
```
EMAIL_USER=your_production_email
EMAIL_PASS=your_app_password
TWILIO_ACCOUNT_SID=your_twilio_sid (optional)
TWILIO_AUTH_TOKEN=your_auth_token (optional)
TWILIO_PHONE_NUMBER=your_twilio_number (optional)
CLIENT_URL=https://yourdomain.com
```

---

## 9. Quick Reference

| Feature | Status | Setup Required |
|---------|--------|-----------------|
| Email Invitations | ✅ Ready | Update EMAIL_USER & EMAIL_PASS |
| SMS Invitations | ⏳ Optional | Get Twilio credentials + `npm install twilio` |
| Invitation Tokens | ✅ Working | Auto-generated, 7-day expiry |
| Token Hashing | ✅ Secure | SHA-256 hashing |
| Delivery Tracking | ✅ Logging | Stored in contact record |

---

## 10. For Jerome Samaratunge

To resend invitation to Jerome:

### Via Test Script:
```bash
node test-send-invitation.js
```

### Via API:
```bash
# Get Jerome's contact ID
curl http://localhost:5001/api/guardian/debug/emergency-contacts

# Resend invitation
curl -X POST http://localhost:5001/api/emergency-contacts/{contact_id}/resend-invite \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**Next Steps:**
1. ✅ Update EMAIL_USER and EMAIL_PASS in `.env`
2. (Optional) Get Twilio credentials and add to `.env`
3. ✅ Run `node test-send-invitation.js` to test
4. ✅ Check email/SMS for invitation
5. ✅ Click link and sign up as emergency contact
