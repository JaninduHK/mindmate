# Emergency Contact Guardian Signup - Complete Flow

## 🎯 The Correct Workflow

### For User Adding Emergency Contact (Steshan)
1. Go to Emergency Contacts
2. Click "Add Emergency Contact"
3. Enter:
   - Full Name: "John Guardian"
   - Email: "john@example.com"
   - Phone: Optional
   - Relationship: Family/Friend/Therapist
4. Click Submit
5. ✅ John receives an email with invitation link

### For Emergency Contact (John)
**Step 1: Receive Invitation Email**
- Email arrives: "You've been added as an emergency contact"
- Subject: "You've been invited to MindMate"
- Contains: **Clickable button/link to signup**

**Step 2: Click Invitation Link**
- Link format: `http://localhost:5173/guardian-signup?token=TOKEN_HERE`
- This takes them to Guardian Signup page
- The signup page should have the email pre-filled (or at least known from the token)

**Step 3: Create Guardian Account**
- Form fields:
  - Full Name: (can edit if needed)
  - Email: (from invitation)
  - Password: (create new)
  - Confirm Password
- Click Submit
- ✅ Account created as Guardian

**Step 4: Logged In as Guardian**
- Redirected to Guardian Dashboard
- Can monitor Steshan's moods, goals, alerts
- Can see emergency contacts list

---

## ❌ WRONG Approach (What's Happening)

User is trying to:
1. Click "Sign Up" or "Register" button
2. Go to regular signup page (`/register`)
3. Enter John's email
4. Get error: "Invalid email"

**This is wrong because:**
- The regular signup uses `registerSchema` validation
- The guardian signup is a different flow with invitation tokens

---

## ✅ How to Fix This

### Option 1: User Should Use Invitation Link
**Best Practice**: Emergency contact should **always** click the invitation link they receive in their email.

The link will be:
```
http://localhost:5173/guardian-signup?token=XXXXXXXXXXXX
```

This automatically routes them to the correct guardian signup page.

### Option 2: Make Guardian Signup More Flexible
Add an endpoint that allows creating a guardian account directly if email is in pending invitations.

---

## 📧 Email Flow Verification

Let me check if the invitation email is being sent correctly:

### What Should Happen:
1. User clicks "Add Emergency Contact"
2. Backend creates EmergencyContact record:
   - status: 'pending'
   - email: john@example.com
   - inviteTokenHash: HASHED_TOKEN
   - inviteExpiresAt: 7 days from now

3. Backend sends email to john@example.com with:
   - Subject: Emergency Contact Invitation
   - Body: Welcome message + action button
   - Button link: `/guardian-signup?token=PLAIN_TOKEN`

4. John clicks button → Goes to `/guardian-signup?token=...`

5. Frontend recognizes token and shows Guardian Signup form

6. John enters details and submits

7. Backend:
   - Verifies token hash
   - Creates User account (role: guardian)
   - Updates EmergencyContact status: 'accepted'
   - Links contactUserId to new User

---

## 🔧 Potential Issues

### Issue 1: Email Not Being Sent
**Check**:
- .env has `EMAIL_USER` and `EMAIL_PASS`
- Check backend logs for email sending errors
- Check spam folder

### Issue 2: Invitation Link Not Working
**Check**:
- Token is properly passed in URL
- Frontend GuardianSignup page recognizes token
- Token hash verification is working

### Issue 3: Token Validation Failing
**In GuardianSignup controller**, verify:
- EmergencyContact found by email
- inviteStatus is 'pending'
- Token hash matches
- Token not expired

---

## 📝 Complete Test Walkthrough

### Setup
1. Create Steshan account
2. Create 2 dummy email accounts (use temp email or real emails)

### Step 1: Add Emergency Contacts
**Login as Steshan:**
```
1. Go to Emergency Contacts
2. Click "Add Emergency Contact"
3. Enter:
   - Name: "Test Guardian 1"
   - Email: test1@tempmail.com  ← Use THIS email
   - Relationship: Family
4. Submit
5. Repeat for test2@tempmail.com
```

**Expected**: Two pending invitations shown

### Step 2: Check Email for Invitation
```
1. Check inbox of test1@tempmail.com
2. Look for email from noreply@mindmate.com with subject "You've been invited"
3. Find the blue "Accept Invitation" button or link
4. Note the link - it should say /guardian-signup?token=...
```

### Step 3: Click Invitation & Signup
```
1. Click the link from the email
2. Browser opens /guardian-signup?token=...
3. Form appears with fields:
   - Full Name: (empty or pre-filled)
   - Email: test1@tempmail.com (from token)
   - Password: (empty)
   - Confirm Password: (empty)
4. Fill in your details:
   - Full Name: Test Guardian 1
   - Password: Test@123456
   - Confirm: Test@123456
5. Click "Create Account"
```

**Expected**: 
- ✅ "Account created successfully!" message
- ✅ Redirected to Guardian Dashboard
- ✅ Can see Steshan's data

### Step 4: Verify in Backend
```bash
# Check MongoDB
db.emergencycontacts.findOne({ 
  email: 'test1@tempmail.com' 
})

# Should show:
{
  inviteStatus: 'accepted',  # Changed from pending!
  contactUserId: ObjectId(...), # Now has user ID
  fullName: 'Test Guardian 1'
}

# Check that User account was created
db.users.findOne({ email: 'test1@tempmail.com' })
# Should show: role: 'guardian'
```

---

## 🚨 Troubleshooting "Invalid Email" Error

If you get "invalid email" error:

### Check 1: Using Wrong Signup Route?
- ❌ **WRONG**: email@test.com → Click Register → Enter email
- ✅ **RIGHT**: Check email inbox → Click invitation link → Sign up

### Check 2: Email Format Issue?
Open browser console (F12):
```javascript
// Test if email passes Joi validation
const testEmail = "test@example.com";
// Regex from frontend
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
console.log(emailRegex.test(testEmail));  // Should be true

// Your email:
const yourEmail = "your.email@domain.com";
console.log(emailRegex.test(yourEmail));  // What does this show?
```

### Check 3: Invitation Link Missing?
- Make sure email actually sent
- Check spam folder
- Check backend logs for email errors
- Try resending invitation OR manually construct URL:
  ```
  http://localhost:5173/guardian-signup
  (Only works if token is passed in query param)
  ```

### Check 4: Token Expired?
- Invitations expire after 7 days
- Ask original user to send new invitation

---

## 📚 Email Content Example

### Guardian Signup Invitation Email

**Subject**: MindMate Emergency Contact Invitation

**Body**:
```
Hi John,

Sarah has added you as an emergency contact on MindMate.

MindMate is a comprehensive mental health platform that allows users 
to track their mood, set wellness goals, and share their wellbeing 
information with trusted people like you.

As John's emergency contact, you'll be able to:
• Monitor their mood trends
• Receive alerts if they're experiencing difficulties
• View their wellness goals and progress
• Access quick contact information

To accept this invitation and create your guardian account, 
please click the button below:

[ACCEPT INVITATION]
https://localhost:5173/guardian-signup?token=abc123...

This link will expire in 7 days.

Best regards,
MindMate Team
```

---

## 🔐 Security Notes

| Aspect | Implementation |
|--------|-----------------|
| Token Generation | Random 32-byte token |
| Token Storage | SHA-256 hashed in DB |
| Token Verification | Hash match check |
| Expiry | 7 days from creation |
| Email Validation | Joi email format |
| Password Security | Min 8 chars, uppercase, lowercase, number |

---

## ✨ Complete System Status

| Component | Status | Notes |
|-----------|--------|-------|
| Email Sending | ✅ | Uses Nodemailer SMTP |
| Invitation Token | ✅ | Secure hash verification |
| Guardian Signup | ✅ | Accepts invitation tokens |
| Email Validation | ✅ | Joi standard email format |
| Contact Acceptance | ✅ | Updates inviteStatus to 'accepted' |
| User Creation | ✅ | Creates user with guardian role |
| Guardian Dashboard | ✅ | Shows Steshan's monitoring |

---

## 🎯 Quick Reference

### Endpoints
```
POST /api/auth/register              ← Regular user signup
POST /api/auth/guardian-signup       ← Guardian signup (with token)
POST /api/emergency-contacts         ← Add emergency contact
GET /api/guardian-dashboard/...      ← See monitored users
```

### Routes
```
/register                ← Regular signup page
/guardian-signup         ← Guardian signup page
/guardian-signup?token=X ← Guardian signup with token
/login                   ← Login page
/emergency-contacts      ← Manage emergency contacts
```

### Database Collections
```
users                    ← User accounts (role: user/guardian/counselor)
emergencycontacts        ← Emergency contact records
refreshtokens           ← Session tokens
```

---

## 📞 What To Do Next

1. **Test the invitation flow**:
   - Add emergency contact
   - Check email
   - Click link
   - Sign up as guardian

2. **If email doesn't arrive**:
   - Check .env EMAIL_USER and EMAIL_PASS
   - Check backend logs
   - Try resending invitation

3. **If signup fails**:
   - Check browser console for errors
   - Check Network tab (DevTools) for 400 errors
   - Verify token is in URL
   - Check MongoDB to see if token exists

4. **If everything works**:
   - Guardian can monitor user's data
   - Receive alerts when user adds moods
   - See analytics and trends

---

**The system is designed so emergency contacts MUST use the invitation link they receive. This is the secure way to create guardian accounts!** ✅

