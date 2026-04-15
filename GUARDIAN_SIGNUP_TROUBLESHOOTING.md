# Guardian Signup - Quick Troubleshooting Guide

## The Problem You're Experiencing

**Scenario**: 
1. You added emergency contacts to Steshan's account
2. You logged out
3. You tried to create a new account with that emergency contact's email
4. You got an error: "Invalid email"

**Why This Happens**:
- Emergency contacts need to use the **invitation link** they receive in their email
- They should NOT use the regular signup form (`/register`)
- They should use the guardian signup form via the invitation link

---

## ✅ Correct Steps to Add Guardian

### Step 1: Add Emergency Contact (As Steshan)
```
1. Login as Steshan
2. Go to "Emergency Contacts"
3. Click "Add Emergency Contact"
4. Enter:
   - Full Name: "John Smith"
   - Email: "john@example.com"  ← THIS email receives invitation
   - Phone: "123456789" (optional)
   - Relationship: "Family" / "Friend" / "Therapist"
5. Click Submit
```

**Result**: An invitation email is sent to john@example.com

---

### Step 2: Check Email Inbox (As John)
```
1. Open email inbox for john@example.com
2. Find email from: noreply@mindmate.com
3. Subject: "You've been invited to MindMate"
4. Find the button that says: "ACCEPT INVITATION"
5. Click it
```

**Result**: Browser opens a page like:
```
http://localhost:5173/guardian-signup?token=XXXXXXXXXXXXXX
```

---

### Step 3: Fill Guardian Signup Form (As John)
```
Page shows: "Guardian Signup"

Fields to fill:
- Full Name: "John Smith" (or whatever name)
- Email: john@example.com (might be auto-filled)
- Password: "Strong@Pass123"
- Confirm Password: "Strong@Pass123"

Click: "Create Account"
```

**Result**: 
- ✅ "Account created successfully!"
- ✅ Redirected to Guardian Dashboard
- ✅ Can see Steshan's mood trends and alerts

---

## ❌ WRONG Way (What You Might Be Doing)

```
❌ DO NOT DO THIS:

1. Click "Sign Up" / "Register" button
2. Go to form page
3. Enter john@example.com in email field
4. Enter password
5. Click Submit
6. Get error: "Invalid email" or "Email already exists"
```

---

## 🔥 If Email Says "Invalid Email"

### Check 1: Email Format
**Is your email format correct?**
```
✅ VALID:
- john@example.com
- john.smith@example.co.uk
- john+guardian@example.com

❌ INVALID:
- john@example (no domain extension)
- john@.com (no domain name)
- john@@example.com (double @)
- john example@example.com (space in name)
```

### Check 2: Browser Console
1. Press **F12** to open Developer Tools
2. Go to **Console** tab
3. See if there are error messages
4. Look for messages like:
   - "Cannot read property of undefined"
   - "Email validation failed"
   - "Network error"

### Check 3: Network Tab
1. Press **F12** to open Developer Tools
2. Go to **Network** tab
3. Select "XHR" filter
4. Try to signup
5. Look for POST request to `/auth/guardian-signup`
6. Check the response:
   - **Status 201**: Success ✅
   - **Status 400**: Invalid data ❌
   - **Status 409**: Email already exists ❌
   - **Status 500**: Server error ❌

---

## 📧 If Email Wasn't Received

### Check 1: Spam/Promotions Folder
- Gmail: Check "Promotions" and "Updates" tabs
- Outlook: Check "Other" and "Spam" folders
- Yahoo: Check "Bulk Mail" folder

### Check 2: Resend Invitation (As Steshan)
1. Login as Steshan
2. Go to Emergency Contacts
3. Find the contact that didn't receive email
4. Click the "..." menu (three dots)
5. Select "Resend Invitation"
6. Check email again

### Check 3: Check Email Configuration (.env)
```
Ask Steshan to verify:
- EMAIL_USER is set (Gmail email address)
- EMAIL_PASS is set (Gmail app-specific password, NOT regular password)
- EMAIL_HOST = smtp.gmail.com
- EMAIL_PORT = 587

If using Gmail:
1. Go to myaccount.google.com
2. Security settings
3. App passwords
4. Generate password for Mail
5. Use that password in .env
```

### Check 4: Check Backend Logs
```
In the terminal where backend is running:

Look for:
✅ "Emergency email sent to john@example.com"
❌ "Failed to send email to john@example.com"
❌ "ENOTFOUND: Cannot look up email service"
```

---

## 🛠️ Safe Troubleshooting Steps

### Step A: Clear Everything & Start Fresh
```
1. Delete all emergency contacts
2. Delete all guardian accounts (except Steshan)
3. Start over with Step 1 above
```

### Step B: Use Console Log to Test
Open backend terminal and run:
```bash
# Check if email service is connected
npm run dev

# Watch for logs that say:
# "Email service connected" or
# "SMTP connection ready"
```

### Step C: Manual URL Testing
If invitation email wasn't received, manually construct URL:

**Steshan adds John at john@example.com**, then:
```
1. Get the invitation token from:
   MongoDB → emergencycontacts → find john's record → copy inviteTokenHash

2. Manually create URL:
   http://localhost:5173/guardian-signup?token=PASTE_TOKEN_HERE

3. Open this URL in browser
4. Form should appear with john@example.com email
5. Fill out rest and submit
```

---

## ✨ Expected Behavior

### If Everything Works Correctly:

**Timeline**:
- **T=0 sec**: Steshan adds emergency contact with John's email
- **T=0.5 sec**: Invitation email sent to John
- **T=1 min**: John receives email (check inbox)
- **T=2 min**: John clicks link
- **T=3 min**: Guardian signup form appears
- **T=5 min**: John fills form and submits
- **T=6 min**: ✅ John's guardian account created
- **T=7 min**: John can see Steshan's dashboard

### What You'll See:

**Steshan's side**:
- Emergency contact appears as "Pending" at first
- Changes to "Accepted" after John signs up

**John's side**:
- Receives invitation email
- Signup form appears when clicking link
- Account created as "Guardian"
- Can access monitoring dashboard

---

## 📱 Quick Checklist

- [ ] Email configured in .env properly
- [ ] Emergency contact email address is correct
- [ ] Awaited invitation email in inbox
- [ ] Checked spam folder
- [ ] Clicked the link in invitation email
- [ ] Filled guardian signup form completely
- [ ] Password meets requirements (8+ chars, uppercase, lowercase, number)
- [ ] Confirmed password matches
- [ ] Guardian account appears in MongoDB
- [ ] Can login as guardian and see monitoring dashboard

---

## 🎯 Summary

**The flow is:**
```
Add Contact Email
      ↓
Send Invitation
      ↓
Receive Email
      ↓
Click Link
      ↓
Guardian Signup Form
      ↓
Create Account
      ↓
Access Dashboard ✅
```

**NOT:**
```
Add Contact Email
      ↓
Try to use regular signup
      ↓
"Invalid Email" Error ❌
```

---

## 📞 If Still Having Issues

1. **Check backend logs** for email errors
2. **Check MongoDB** to verify EmergencyContact record exists
3. **Check email inbox** including spam folder
4. **Try resending** invitation from the app
5. **Check .env** for email configuration
6. **Open browser console** (F12) for client-side errors

---

**Remember: Use the invitation link email sends, don't try to signup with the email directly!** ✅

