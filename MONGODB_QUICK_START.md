# MongoDB & Full Stack Quick Start

## Prerequisites Check ✅

Ensure you have:
- ✅ Node.js 16+ installed
- ✅ npm or yarn package manager
- ✅ MongoDB Atlas account (ALREADY CONFIGURED ✓)
- ✅ `.env` file with `MONGODB_URI=mongodb+srv://steshan:...` ✓
- ✅ Internet connection

---

## Step 1: Start Backend Server ▶️

Open Terminal/PowerShell and run:

```bash
cd c:\Users\USER\OneDrive\Desktop\Mindmate\mindmate\backend
npm run dev
```

**Wait for this message**:
```
✅ MongoDB Connected: cluster0.kniz0ka.mongodb.net
🚀 Server running on port 5001
```

✅ **Backend Ready** on http://localhost:5001

---

## Step 2: Start Frontend Server ▶️

Open **NEW** Terminal/PowerShell and run:

```bash
cd c:\Users\USER\OneDrive\Desktop\Mindmate\mindmate\frontend
npm run dev
```

**Wait for this message**:
```
➜  Local:   http://localhost:5173/
```

✅ **Frontend Ready** on http://localhost:5173

---

## Step 3: Open App in Browser 🌐

Open your browser and go to:
```
http://localhost:5173
```

You should see the **MindMate login page**.

---

## Step 4: Login or Register

1. Click **Register** to create a new account
2. Fill in email, password, name
3. Select role: **User** (to test mood/goal features)
4. Click **Register**
5. Login with your credentials

---

## Step 5: Test Data Flow to MongoDB 📊

### **Test A: Create a Mood Entry**

1. Once logged in, go to **Personal Tracking** → **Moods**
2. Click on today's date to add mood
3. Fill form:
   - **Mood**: Select "Positive"
   - **Keyword**: Type "Testing"
   - **Description**: Type "Testing MongoDB"
4. Click **Submit**

**Expected**:
- ✅ Success message appears
- ✅ Mood shows in the calendar/list
- ✅ Backend logs show: `POST /api/personal-tracking/moods 201`

---

### **Test B: Verify in MongoDB** ✓

#### **Using MongoDB Compass (GUI)**:

1. Install [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Click **New Connection**
3. Paste your connection string:
   ```
   mongodb+srv://steshan:Steshan%402003@cluster0.kniz0ka.mongodb.net/Mindmate
   ```
4. Click **Connect**
5. Navigate: **Mindmate** (database) → **moods** (collection)
6. You should see your mood entry!

**Your data is in MongoDB!** ✅

---

### **Test C: Create a Goal**

1. Go to **Personal Tracking** → **Goals**
2. Click **Add Goal**
3. Fill form:
   - **Goal Name**: "Run 5K"
   - **Type**: "weekly"
   - **Status**: "Not started"
4. Click **Submit**

**In MongoDB Compass**:
- Go to **goals** collection
- You should see your goal there!

---

### **Test D: Add Emergency Contact**

1. Go to **Settings** or **Emergency Contacts**
2. Click **Add Contact**
3. Fill form:
   - **Name**: "Guardian Name"
   - **Email**: "guardian@example.com"
   - **Phone**: "+1234567890"
   - **Relationship**: "Family"
4. Click **Submit**

**In MongoDB**:
- Go to **emergencycontacts** collection
- You should see the contact with `inviteStatus: "pending"`!

---

## Real-Time MongoDB Monitoring 📈

### **Option 1: MongoDB Compass (Easy)**
- Download & install [MongoDB Compass](https://www.mongodb.com/products/compass)
- Connect with your connection string
- Browse collections in real-time
- Edit/view documents easily

### **Option 2: MongoDB Atlas Web UI**
1. Open https://cloud.mongodb.com
2. Login to your account
3. Click your **Mindmate** cluster
4. Click **Collections** tab
5. Browse moods, goals, contacts collections

### **Option 3: MongoDB Shell (Terminal)**
```bash
mongosh "mongodb+srv://steshan:Steshan%402003@cluster0.kniz0ka.mongodb.net/Mindmate"

# Then run queries:
db.moods.find().pretty()
db.goals.find().pretty()
db.emergencycontacts.find().pretty()
```

---

## Debug Network Calls 🔍

### **In Browser (Chrome DevTools)**

1. Open http://localhost:5173
2. Press **F12** (Developer Tools)
3. Go to **Network** tab
4. Create a mood entry
5. You'll see POST request to `/api/personal-tracking/moods`
6. Click on it to see:
   - **Headers** → Authorization token, Content-Type
   - **Payload** → mood, keyword, description
   - **Response** → Success message with saved mood ID

**This confirms data is being sent!** ✅

---

## Troubleshooting 🔧

### **Issue: Backend won't connect to MongoDB**

```
❌ Error: getaddrinfo ENOTFOUND cluster0.kniz0ka.mongodb.net
```

**Fix**:
1. Check `.env` has correct `MONGODB_URI`
2. Verify internet is working
3. In MongoDB Atlas, go to **Network Access** → whitelist IP `0.0.0.0/0`
4. Restart backend: `npm run dev`

---

### **Issue: Frontend shows "Cannot reach backend"**

**Fix**:
1. Ensure backend is running (check console for "Server running on port 5001")
2. Try: `curl http://localhost:5001/api/health` in terminal
3. Check CORS is allowing localhost:5173 (it is by default)
4. Restart both servers

---

### **Issue: Data not appearing in MongoDB**

**Debug Steps**:
1. Check browser console (F12) for errors
2. Check Network tab → see if POST request succeeded (201 status)
3. Check backend logs for error messages
4. Verify MongoDB compass can connect
5. Check if data is going to correct database (`Mindmate`)

---

### **Issue: Port 5001 already in use**

```
Error: listen EADDRINUSE :::5001
```

**Fix**:
```powershell
# PowerShell - Kill the process on port 5001
Get-Process -Id (Get-NetTCPConnection -LocalPort 5001).OwningProcess | Stop-Process -Force

# Then restart backend
npm run dev
```

---

## Quick Reference 📌

| What | Where | Port |
|------|-------|------|
| **Frontend** | http://localhost:5173 | 5173 |
| **Backend API** | http://localhost:5001/api | 5001 |
| **MongoDB** | mongodb+srv://... | (Atlas) |
| **Health Check** | http://localhost:5001/api/health | 5001 |

---

## Files to Know About 📁

```
backend/
├── server.js                              ← Main server
├── .env                                   ← Config (MONGODB_URI here)
├── config/database.js                     ← MongoDB connection
├── models/
│   ├── Mood.js                            ← Mood schema
│   ├── Goal.js                            ← Goal schema
│   └── EmergencyContact.model.js
├── controllers/
│   ├── moodController.js                  ← Add mood logic
│   └── goalController.js                  ← Add goal logic
└── routes/
    ├── moodRoutes.js
    ├── goalRoutes.js
    └── emergencyContact.routes.js

frontend/
└── src/
    ├── pages/PersonalTracking/
    │   ├── MoodPage.jsx
    │   └── GoalPage.jsx
    └── api/axios.config.js                ← API config
```

---

## Success! 🎉

When you see all of this:
- ✅ Backend logs: "MongoDB Connected"
- ✅ Frontend loads at http://localhost:5173
- ✅ Can create moods/goals without errors
- ✅ Data appears in MongoDB (Compass/Shell)
- ✅ Network tab shows successful POST requests

**You're ready to use your app!** 

---

## Next: Guardian Dashboard

Test the Guardian Dashboard:

1. Add yourself as an emergency contact for another user:
   - Create user #1 (from account A)
   - Create user #2 (from account B)
   - On user #1, add user #2 as emergency contact
   - On user #2 (as guardian), go to Guardian Dashboard
   - See user #1's moods, goals, analytics in real-time!

✅ **All data flows live from MongoDB!**

---

**You're all set! Enjoy testing MindMate with MongoDB!** 🚀
