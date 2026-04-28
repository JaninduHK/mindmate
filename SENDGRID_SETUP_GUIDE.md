# SendGrid Email Integration Guide

## ✅ What's Been Set Up

### 1. **SendGrid Installation**
- ✅ Installed `@sendgrid/mail` npm package
- ✅ API Key configured in `.env`
- ✅ Email sender configured in `.env`

### 2. **Backend Configuration**
- **`.env` File Updated:**
  ```
  SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY
  SENDGRID_FROM_EMAIL=samaratungesteshan@gmail.com
  FRONTEND_URL=http://localhost:3000
  ```

### 3. **Email Utilities Created**
- **`utils/email.util.js`** - Main SendGrid email function (replaced Nodemailer)
- **`utils/sendEmail.js`** - Professional email templates with HTML styling
- **`routes/testEmail.routes.js`** - Test endpoints to verify SendGrid

### 4. **Emergency Contact Invitation Flow**

When a user **registers with an emergency contact** or **adds an emergency contact later**:

1. ✅ User creates account
2. ✅ Emergency contact record is created
3. ✅ Unique invitation token is generated
4. ✅ **SendGrid sends professional HTML email** to emergency contact with:
   - Welcome message
   - User name and relationship
   - Registration link with token
   - Clear call-to-action button
   - 7-day expiration notice

5. ✅ Emergency contact clicks link and registers as "Guardian"
6. ✅ Full guardian dashboard access granted

---

## 🧪 Testing the Integration

### **Test Endpoint 1: Send Test Email**

```bash
POST http://localhost:5001/api/test/test-sendgrid
Content-Type: application/json

{
  "to": "your-email@gmail.com",
  "subject": "Test Email from MindMate",
  "html": "<h1>Hello!</h1><p>This is a test email from SendGrid integration.</p>"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "✅ Test email sent to your-email@gmail.com"
}
```

---

### **Test Endpoint 2: Send Emergency Contact Invitation**

```bash
POST http://localhost:5001/api/test/test-emergency-invitation
Content-Type: application/json

{
  "to": "emergency-contact@gmail.com",
  "contactName": "John Doe",
  "ownerName": "Jane Smith",
  "relationship": "Brother"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "✅ Test invitation email sent to emergency-contact@gmail.com"
}
```

---

## 📧 What the Emergency Contact Receives

When an emergency contact is invited, they receive a professional HTML email with:

✅ **Header:** MindMate branding and emergency contact icon  
✅ **Personalized Greeting:** "Hi [Contact Name]"  
✅ **Context:** Who invited them and their relationship  
✅ **Benefits:** List of what they can do as a guardian  
✅ **Call-to-Action Button:** "Accept Invitation & Register"  
✅ **Token Security:** Unique 7-day expiration token  
✅ **Footer:** MindMate branding and contact info  

---

## 🔄 Complete Emergency Contact Registration Flow

### **User Side (Registration):**
```
1. User goes to /register
2. Fills in personal info
3. Adds emergency contact details (name, email, relationship)
4. Clicks "Register"
5. Account created ✅
6. Invitation email sent to emergency contact ✅
```

### **Emergency Contact Side:**
```
1. Receives email from MindMate
2. Clicks "Accept Invitation & Register"
3. Redirected to: /register?token=UNIQUE_TOKEN&type=emergency-contact
4. Fills in registration form
5. Account created as "emergency_contact" role
6. Gains access to Guardian Dashboard
7. Can monitor monitored user's mood & goals
8. Receives emergency alerts
```

---

## 📁 Files Created/Modified

### **New Files:**
- ✅ `backend/utils/sendEmail.js` - Professional email utilities
- ✅ `backend/routes/testEmail.routes.js` - Test endpoints

### **Modified Files:**
- ✅ `backend/.env` - Added SendGrid config
- ✅ `backend/utils/email.util.js` - Switched to SendGrid
- ✅ `backend/server.js` - Registered test routes

### **Existing Integration Points:**
- ✅ `backend/controllers/auth.controller.js` - Already sends invitations on register
- ✅ `backend/utils/invitationMailer.js` - Professional email templates
- ✅ `backend/services/invitationService.js` - Token generation & management

---

## 🚀 How to Test End-to-End

### **Step 1: Start Backend**
```bash
cd backend
npm start
```

### **Step 2: Test SendGrid Connection**
```bash
curl -X POST http://localhost:5001/api/test/test-sendgrid \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-test-email@gmail.com",
    "subject": "MindMate Test Email",
    "html": "<h2>Hello from MindMate!</h2><p>SendGrid is working!</p>"
  }'
```

### **Step 3: Test Invitation Email**
```bash
curl -X POST http://localhost:5001/api/test/test-emergency-invitation \
  -H "Content-Type: application/json" \
  -d '{
    "to": "emergency-contact@gmail.com",
    "contactName": "John Doe",
    "ownerName": "Jane Smith",
    "relationship": "Brother"
  }'
```

### **Step 4: Register User with Emergency Contact**
1. Go to frontend: `http://localhost:3003/register`
2. Fill in user details
3. Add emergency contact (name, email, relationship)
4. Click "Register"
5. Check email inbox for invitation

---

## ⚙️ How It Works Behind the Scenes

### **1. Registration Controller** (`auth.controller.js`)
```javascript
if (initialEmergencyContact && initialEmergencyContact.fullName) {
  // Create emergency contact record
  const emergencyContact = await EmergencyContact.create({...});
  
  // Generate invitation token
  const { token, expiresAt } = await invitationService.createInvitation(...);
  
  // Compose and send email via SendGrid
  await sendEmail({
    to: initialEmergencyContact.email,
    subject: emailContent.subject,
    html: emailContent.html,
  });
}
```

### **2. SendGrid Email Utility** (`utils/email.util.js`)
```javascript
export const sendEmail = async ({ to, subject, html, text }) => {
  const message = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject,
    html: html || text,
  };
  
  const response = await sgMail.send(message);
  console.log(`✅ Email sent to ${to}`);
  return response;
};
```

### **3. Email Template** (`utils/invitationMailer.js`)
Professional HTML template with:
- Inline CSS styling
- Responsive design
- Clear call-to-action
- Expiration notice

---

## 🔐 Security Features

✅ **Unique Token per Invitation:** Each invitation gets a unique, hashed token  
✅ **Token Expiration:** 7-day expiration by default  
✅ **One-Time Use:** Token is invalidated after acceptance  
✅ **Email Verification:** Only the invited email can accept  
✅ **Role-Based Access:** Emergency contacts get limited "emergency_contact" role  

---

## 📝 For VIVA/Demo

### **What to Highlight:**

1. **Email Integration Setup:**
   - SendGrid API key configured securely in .env
   - Professional HTML email templates
   - Error handling and logging

2. **Emergency Contact Flow:**
   - User registers with emergency contact email
   - Invitation sent automatically via SendGrid
   - Contact receives personalized email
   - Click link to register as guardian

3. **Guardian Access:**
   - Emergency contact can see monitored user's mood entries
   - Can view goal progress and status
   - Receives alerts in emergency mode
   - Full dashboard monitoring

4. **Testing:**
   - Run test endpoints to verify SendGrid
   - Show email received in inbox
   - Demo registration flow end-to-end

---

## ✨ Key Benefits

- ✅ Reliable email delivery via SendGrid
- ✅ Professional HTML emails
- ✅ Automatic emergency contact monitoring
- ✅ Secure token-based invitations
- ✅ Scalable email infrastructure
- ✅ Easy to test and debug

---

## 🐛 Troubleshooting

**Email not sending?**
- Check `.env` file has correct `SENDGRID_API_KEY`
- Verify `SENDGRID_FROM_EMAIL` is verified in SendGrid
- Check backend console for error messages

**Invitation link not working?**
- Verify `FRONTEND_URL` in `.env` matches your frontend URL
- Check token is being generated in database
- Ensure registration page handles `?token=` query param

**Need to test locally?**
- Use `http://localhost:3003` for `FRONTEND_URL` (or your frontend port)
- Use test endpoints at `/api/test/test-sendgrid`
- Check console logs for SendGrid errors

---

## 📞 Support

For any issues:
1. Check backend console logs
2. Test with `/api/test/test-sendgrid` endpoint
3. Verify SendGrid API key is valid
4. Check email spam folder
5. Review error messages in response

