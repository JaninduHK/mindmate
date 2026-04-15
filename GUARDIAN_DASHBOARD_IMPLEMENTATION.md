# Guardian Dashboard Enhancement - Complete Implementation

## Overview
This document outlines all the changes made to enhance the Guardian Dashboard with real data integration, mood monitoring alerts, analytics, and emergency contact management.

---

## BACKEND CHANGES

### 1. **File: `backend/controllers/guardian.controller.js`**

#### New Methods Added:

**1.1. `getUserMoodAnalytics(req, res)`**
- **Purpose**: Returns comprehensive mood analytics for a monitored user
- **Endpoint**: `GET /guardian/:userId/moods/analytics`
- **Returns**:
  ```json
  {
    "distribution": {"Positive": 5, "Stable": 10, "Pressure": 3, "Low": 2},
    "trend": [{"date": "2024-04-11", "mood": "Positive", "score": 8, "keyword": "energetic"}],
    "average": 6.5,
    "totalEntries": 20,
    "consecutiveNegative": false,
    "recentMoods": [...]
  }
  ```
- **Features**:
  - Analyzes last 30 days of moods
  - Calculates average mood score
  - Detects consecutive negative moods (3+ days)
  - Provides 7-day trend data
  - Lists 5 most recent moods with detailed descriptions

**1.2. `getUserGoalAnalytics(req, res)`**
- **Purpose**: Returns goal progress analytics for a monitored user
- **Endpoint**: `GET /guardian/:userId/goals/analytics`
- **Returns**:
  ```json
  {
    "total": 10,
    "completed": 5,
    "inProgress": 3,
    "notStarted": 2,
    "completionRate": 50.0,
    "goals": [...]
  }
  ```
- **Features**:
  - Tracks total, completed, in-progress, and not-started goals
  - Calculates completion percentage
  - Lists up to 10 recent goals

**1.3. `getMoodAlerts(req, res)`**
- **Purpose**: Detects and returns concerning mood patterns
- **Endpoint**: `GET /guardian/:userId/moods/alerts`
- **Returns Alert Types**:
  1. **Consecutive Negative Moods**: 3+ days of Low/Pressure moods
  2. **Very Low Moods**: 2+ entries with "Low" mood in last 14 days
  3. **Recent Low Mood**: Latest mood entry was "Low"
  4. **No Recent Entry**: No mood logged in last 48 hours
- **Alert Structure**:
  ```json
  {
    "type": "consecutive_negative",
    "severity": "high|critical|medium",
    "title": "Alert Title",
    "description": "Detailed description",
    "date": "timestamp"
  }
  ```

### 2. **File: `backend/routes/guardian.routes.js`**

#### New Routes Added:

```javascript
// Mood Analytics
GET /guardian/:userId/moods/analytics

// Mood Alerts/Warnings
GET /guardian/:userId/moods/alerts

// Goal Analytics
GET /guardian/:userId/goals/analytics
```

#### Import Changes:
Added imports for new controller methods:
- `getUserMoodAnalytics`
- `getUserGoalAnalytics`
- `getMoodAlerts`

---

## FRONTEND CHANGES

### 1. **File: `frontend/src/api/guardianApi.js`**

#### New Methods Added:

```javascript
getMoodAnalytics(userId)          // Fetches mood analytics data
getMoodAlerts(userId)              // Fetches mood alerts/warnings
getGoalAnalytics(userId)           // Fetches goal analytics data
```

---

### 2. **File: `frontend/src/pages/GuardianDashboard.jsx`**

#### Major Changes:
- **Removed**: All mock data
- **Removed**: Hardcoded contact information
- **Added**: Integration with backend APIs
- **Added**: Real data fetching on user selection
- **Added**: New component composition

#### New Features:
1. **Real User Monitoring**
   - Fetches monitored users from `contactsAPI.getMonitoredUsers()`
   - Displays user dropdown selector for multiple monitored users
   - Loads user data from guardian API

2. **Emergency Mode Display**
   - Shows red emergency banner when user is in emergency mode
   - Integrates `GuardianEmergencyBanner` component
   - Displays emergency activation time

3. **Analytics Integration**
   - Integrates `GuardianAnalytics` component
   - Displays mood trends, distribution, averages
   - Shows goal progress and completion rates
   - Fetches data from multiple endpoints in parallel

4. **Alert System**
   - Integrates `GuardianMoodAlerts` component
   - Displays mood warnings and concerning patterns
   - Shows alert severity levels

5. **Sidebar Components**
   - Integrates `GuardianLastActive` for activity status
   - Integrates `GuardianEmergencyContacts` for contact information
   - All data loaded from backend

#### Data Loading Flow:
```
Component Mount
  ↓
Fetch Monitored Users
  ↓
Load User Data (Dashboard, Mood Analytics, Alerts, Goals)
  ↓
Display Components with Real Data
```

---

### 3. **New Component: `GuardianEmergencyBanner.jsx`**

**Location**: `frontend/src/components/guardian/GuardianEmergencyBanner.jsx`

**Purpose**: Display prominent emergency mode notification

**Features**:
- Red alert banner with ShieldAlert icon
- Shows emergency duration (minutes/hours ago)
- Immediate call button
- Location view button (if GPS data available)
- Professional emergency styling

**Props**:
```javascript
{
  user: { emergencyMode, emergencyActivatedAt, emergencyLocation },
  selectedUser: { name, phoneNumber }
}
```

---

### 4. **New Component: `GuardianLastActive.jsx`**

**Location**: `frontend/src/components/guardian/GuardianLastActive.jsx`

**Purpose**: Display user activity status and last active time

**Features**:
- Shows relative time (e.g., "5 minutes ago")
- Color-coded status badges:
  - Emerald: Active in last hour
  - Blue: Active today
  - Yellow: Inactive
  - Red: Emergency mode
- Full timestamp display
- Status indicators (✓ Active, ⚠️ Inactive, 🚨 Emergency)

**Props**:
```javascript
{
  lastActiveTime: Date,
  isEmergencyActive: Boolean
}
```

---

### 5. **New Component: `GuardianEmergencyContacts.jsx`**

**Location**: `frontend/src/components/guardian/GuardianEmergencyContacts.jsx`

**Purpose**: Display and manage user's emergency contacts

**Features**:
- Responsive contact list
- Phone and email action buttons
- Displays relationship for each contact
- Shows "No contacts" message when empty
- One-click calling/emailing

**Props**:
```javascript
{
  contacts: [
    {
      id, name, fullName, phoneNumber, 
      email, relationship, inviteStatus
    }
  ]
}
```

---

### 6. **New Component: `GuardianMoodAlerts.jsx`**

**Location**: `frontend/src/components/guardian/GuardianMoodAlerts.jsx`

**Purpose**: Display mood concerns and alerts

**Features**:
- Severity-color-coded alerts:
  - Red: Critical (very low moods)
  - Orange: High (consecutive negatives)
  - Yellow: Medium (no recent entries)
  - Blue: Low
- Alert icons (AlertTriangle, AlertCircle)
- Detailed descriptions
- Timestamps
- Shows related mood keywords
- "No concerns" message when everything is good

**Props**:
```javascript
{
  alerts: [
    {
      type, severity, title, description, 
      date, keyword, count
    }
  ]
}
```

---

### 7. **New Component: `GuardianAnalytics.jsx`**

**Location**: `frontend/src/components/guardian/GuardianAnalytics.jsx`

**Purpose**: Comprehensive mood and goal analytics visualization

**Features**:

**Mood Charts**:
- 7-day trend area chart showing mood scores
- 30-day mood distribution pie chart
- Average score, total entries, consecutive negative indicator
- Recent mood entries list with descriptions

**Goal Analytics**:
- Total, completed, in-progress, not-started counts
- Completion rate percentage
- Color-coded status indicators
- Goal list with type and status

**Visual Elements**:
- Area chart for mood trends (using Recharts)
- Pie chart for mood distribution
- Gradient status cards
- Color scheme:
  - Positive: Green (#10B981)
  - Stable: Blue (#3B82F6)
  - Pressure: Amber (#F59E0B)
  - Low: Red (#EF4444)

**Props**:
```javascript
{
  moodAnalytics: {
    distribution, trend, average, totalEntries,
    consecutiveNegative, recentMoods
  },
  goalAnalytics: {
    total, completed, inProgress, notStarted,
    completionRate, goals
  },
  loading: Boolean
}
```

---

## DATA FLOW

### On Guardian Dashboard Load:

```
1. Fetch monitored users
   ↓
2. Select first monitored user
   ↓
3. Load user data (4 parallel requests):
   - getUserDashboard()      → Emergency status, last active, contacts, user data
   - getMoodAnalytics()      → Mood trends, distribution, scores
   - getMoodAlerts()         → Warnings and concerning patterns
   - getGoalAnalytics()      → Goal progress and completion rates
   ↓
4. Render components:
   - Emergency banner (if active)
   - Mood alerts (if any)
   - Analytics charts
   - Last active status
   - Emergency contacts list
```

### On User Selection Change:
```
User clicks dropdown → handleUserChange()
  ↓
Call loadUserData(userId)
  ↓
Fetch 4 data endpoints in parallel
  ↓
Update state with new data
  ↓
Components re-render with new data
```

---

## AUTHORIZATION & SECURITY

All new endpoints require:
1. **Authentication**: `verifyToken` middleware
2. **Authorization**: `checkRole(USER_ROLES.EMERGENCY_CONTACT)`
3. **User Verification**: Confirm guardian is authorized for each monitored user

Example verification:
```javascript
const isAuthorized = await EmergencyContact.findOne({
  contactUserId: guardianId,
  ownerUserId: userId,
  inviteStatus: 'accepted'
});

if (!isAuthorized) {
  throw new ApiError(403, 'Not authorized to view this user');
}
```

---

## DATABASE QUERIES

### Mood Analytics (Last 30 Days):
```javascript
Mood.find({
  userId,
  createdAt: { $gte: thirtyDaysAgo }
}).sort({ createdAt: -1 })
```

### Alert Detection (Last 14 Days):
```javascript
Mood.find({
  userId,
  createdAt: { $gte: fourteenDaysAgo }
}).sort({ createdAt: -1 })
```

### Dashboard Data:
```javascript
- User document (emergency status, last active)
- Mood entries (30 limit)
- Goal entries
- Notification entries (high risk alerts)
- Emergency contacts (accepted only)
```

---

## STYLING & DESIGN

### Design System Used:
- **Colors**: Emerald (primary), Red (emergency), Gray (neutral)
- **Components**: Rounded-2xl borders, shadow-sm shadows
- **Responsive**: Tailwind grid system (mobile-first)
- **Icons**: Lucide React icons
- **Charts**: Recharts library

### Responsive Layout:
```
Mobile:  Single column (all sections stacked)
Tablet:  Single column with condensed charts
Desktop: Two-column main + sidebar layout
```

---

## ERROR HANDLING

### Frontend:
- All API calls wrapped in try-catch
- Fallback to null/empty arrays if requests fail
- Loading states prevent UI flashing
- Error messages logged to console

### Backend:
- `asyncHandler` wraps all controllers
- `ApiError` with appropriate status codes
- Authorization checks before data access
- Graceful handling of missing data

---

## TESTING CHECKLIST

- [ ] Guardian can select different monitored users
- [ ] Mood analytics chart renders correctly
- [ ] Mood distribution pie chart displays all moods
- [ ] Goal progress cards show correct percentages
- [ ] Mood alerts appear for concerning patterns
  - [ ] Consecutive negative moods detected
  - [ ] Very low moods flagged
  - [ ] No recent entry warning shows
  - [ ] Recent low mood alerts
- [ ] Emergency banner appears when emergencyMode is true
- [ ] Emergency banner has correct duration display
- [ ] Call button links to correct phone number
- [ ] Emergency contacts display correctly
- [ ] Last active status updates correctly
- [ ] All data refreshes when user changes
- [ ] Loading states display during fetch
- [ ] Error states handle missing data gracefully

---

## PERFORMANCE OPTIMIZATIONS

1. **Parallel Data Fetching**: All 4 requests made simultaneously using `Promise.all()`
2. **Caching**: Data stored in local component state
3. **Conditional Rendering**: Components only render when data available
4. **Lazy Loading**: Charts only render when viewport visible
5. **Efficient Queries**: Backend limits results (30 moods, 10 goals)

---

## FUTURE ENHANCEMENTS

1. **Real-time Updates**: WebSocket integration for live alerts
2. **Location Tracking**: Map display for emergency location
3. **SMS Notifications**: Send SMS to guardian on alerts
4. **Medication Tracking**: Track medication adherence
5. **Sleep Monitoring**: Integrate sleep data
6. **Activity History**: Full audit log of user actions
7. **Custom Alerts**: Guardian can set custom alert thresholds
8. **Report Generation**: Export analytics as PDF
9. **Trend Analysis**: Machine learning for mood predictions
10. **Intervention Suggestions**: AI-powered recommendations

---

## CONFIGURATION

### Backend Routes Prefix:
All routes protected by guardian role and emergency contact verification.

### Frontend API Base:
Uses configured `axiosInstance` from `api/axios.config.js`

### Environment Variables:
None required for this feature (uses existing configuration)

---

## Dependencies

**Backend**: None new (uses existing)
**Frontend**: 
- `recharts` (already installed)
- `lucide-react` (already installed)
- `react-router-dom` (already installed)

---

## File Summary

### Created:
1. `frontend/src/components/guardian/GuardianEmergencyBanner.jsx`
2. `frontend/src/components/guardian/GuardianLastActive.jsx`
3. `frontend/src/components/guardian/GuardianEmergencyContacts.jsx`
4. `frontend/src/components/guardian/GuardianMoodAlerts.jsx`
5. `frontend/src/components/guardian/GuardianAnalytics.jsx`

### Updated:
1. `backend/controllers/guardian.controller.js` (3 new methods)
2. `backend/routes/guardian.routes.js` (3 new routes)
3. `frontend/src/api/guardianApi.js` (3 new methods)
4. `frontend/src/pages/GuardianDashboard.jsx` (complete rewrite)

### Total Changes: 9 files

---

## Questions & Support

For questions or issues, refer to the backend guardian controller methods and frontend component prop interfaces documented above.
