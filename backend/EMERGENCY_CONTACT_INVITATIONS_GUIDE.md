# 📧 Emergency Contact Invitations - Setup Guide

## ✅ Current Status

All **8 emergency contacts** have been prepared with invitation tokens:

| Email | Relationship | Token Status | Expires |
|-------|--------------|--------------|---------|
| dulain@gmail.com | friend | ✅ Ready | May 5, 2026 |
| saman@akbar.com | father | ✅ Ready | May 5, 2026 |
| chamindu@gmail.com | therapist | ✅ Ready | May 5, 2026 |
| steshansamaratunge@aiesec.net | friend | ✅ Ready | May 5, 2026 |
| steshansamaratunge@aiesec.net | brother | ✅ Ready | May 5, 2026 |
| saman@akbar.com | brother | ✅ Ready | May 5, 2026 |
| dulain@gmail.com | friend | ✅ Ready | May 5, 2026 |
| chamindu@gmail.com | friend | ✅ Ready | May 5, 2026 |

---

## 🔴 REQUIRED: Fix SendGrid Sender Email

### Why This is Needed
SendGrid requires email addresses to be **verified as Sender Identities** before sending. Currently, the sender email is not verified.

### How to Fix (3 Steps)

#### **Step 1: Go to SendGrid Settings**
1. Open: https://app.sendgrid.com/
2. Login with your SendGrid account
3. Click **Settings** → **Sender Authentication** (left sidebar)

#### **Step 2: Verify Your Email**
1. Under "Single Sender Verification", click **Verify an Email**
2. Enter your email: `samaratungesteshan@gmail.com`
3. Click **Create**

#### **Step 3: Check Your Email & Confirm**
1. SendGrid will send a verification email to `samaratungesteshan@gmail.com`
2. Open the email and click the verification link
3. Once verified, you'll see a ✅ next to your email in SendGrid

---

## 📧 Send Invitations

Once you've verified your sender email, run this command:

```bash
cd backend
node send-all-invitations.js
```

This will:
- Send invitations to all 8 emergency contacts
- Include a personalized registration link for each contact
- Set tokens to expire in 7 days
- Log all sent emails

---

## 🔗 Registration Flow

### What Happens When Guardians Receive Emails:

1. **Receive Email**: Emergency contact gets invitation email with subject "You're Invited to Join MindMate"
2. **Click Link**: They click "Accept Invitation & Register"
3. **Registration Form**: Taken to `http://localhost:5173/guardian/register?token=...`
4. **Fill Details**: They create their account with password
5. **Account Created**: Guardian account is set up and linked
6. **Log In**: They can now log in to MindMate portal

### Registration URL Format:
```
http://localhost:5173/guardian/register?token=<UNIQUE_TOKEN>
```

---

## 📬 Testing the Invitations

### Option 1: Real Emails
- Send to your actual email addresses
- Check inbox and spam folder
- Verify the links work

### Option 2: Test Service
Alternative test service if you want to verify without sending actual emails:
```bash
curl -X POST http://localhost:5001/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

---

## 🐛 Troubleshooting

### Error: "The from address does not match a verified Sender Identity"
**Solution**: Verify your email in SendGrid (see Steps above)

### Emails not arriving in inbox?
1. Check **spam/junk folder**
2. Verify recipient email addresses are correct
3. Check SendGrid Activity Log: https://app.sendgrid.com/email_activity

### Registration link not working?
1. Make sure frontend is running: `npm run dev` (in frontend folder)
2. Check that token hasn't expired (7 days)
3. Verify token is correctly passed in URL

---

## 📊 Monitoring

### Check SendGrid Activity
1. Go to https://app.sendgrid.com/email_activity
2. Filter by date or email address
3. See: Delivered, Opened, Clicked, Bounced status

### Check Database Records
```bash
# Check all emergency contacts
node check-emergency-contacts-list.js

# Check invitation status  
node check-invitation-status.js
```

---

## 🎯 Complete Workflow

```
1. ✅ Verify sender email in SendGrid
2. ✅ Run: node send-all-invitations.js
3. ✅ Check email inbox for invitations
4. ✅ Click registration links
5. ✅ Complete registration
6. ✅ Log in with credentials
7. ✅ View in Guardian Dashboard
```

---

## 📞 Support

If you have issues:
1. Check SendGrid Sender Authentication settings
2. Run `node test-sendgrid.js` to debug
3. Verify `.env` has correct API key
4. Ensure frontend is running on port 5173

---

**Last Updated**: April 28, 2026  
**Tokens Expire**: May 5, 2026  
**Total Contacts**: 8
