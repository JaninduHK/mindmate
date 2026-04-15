# Guardian Dashboard Integration - HIGH-RISK KEYWORD DETECTION

## ✅ COMPLETION STATUS

All major features for guardian dashboard enhancement have been successfully integrated:

### 1. **Risk Detection Utility (Created)**
- **File**: `backend/utils/riskDetection.js`
- **Features**:
  - High-risk keyword detection with 73+ keywords across 3 severity levels
  - Risk scoring algorithm (0-100 scale)
  - Critical keywords: "want to die", "suicide", "kill myself", "self harm" (27 keywords)
  - High keywords: "feel like dying", "hopeless", "unbearable pain" (26 keywords)
  - Medium keywords: "very sad", "devastated", "stressed" (20+ keywords)

### 2. **Backend Controller Enhancement (Updated)**
- **File**: `backend/controllers/guardian.controller.js`
- **Changes**:
  - ✅ Imported risk detection utility
  - ✅ Enhanced `getMoodAlerts()` to detect high-risk keywords
  - ✅ Added critical alert types for dangerous phrases
  - ✅ Integrated risk scoring with mood analytics
  - ✅ Added recommendations based on risk level
  - ✅ Returns structured risk assessment with factors and recommendations

### 3. **Frontend Component Enhancement (Updated)**
- **File**: `frontend/src/components/guardian/GuardianMoodAlerts.jsx`
- **Improvements**:
  - ✅ Enhanced alert display with critical risk styling
  - ✅ Shows detected keywords prominently with red backgrounds
  - ✅ Risk score progress bar (0-100)
  - ✅ Action buttons for high-risk/critical alerts
  - ✅ Risk assessment summary with factors and recommendations
  - ✅ Animated pulse icon for critical alerts
  - ✅ Color-coded severity badges (red/orange/yellow/blue)
  - ✅ Shows full user statement for critical alerts

### 4. **Emergency Banner Enhancement (Updated)**
- **File**: `frontend/src/components/guardian/GuardianEmergencyBanner.jsx`
- **New Features**:
  - ✅ Displays emergency mode with visual indicators
  - ✅ Shows critical risk alerts separately
  - ✅ Shows high risk alerts with call buttons
  - ✅ Risk score display
  - ✅ Action recommendations
  - ✅ Animated pulse pulse indicator for active emergencies

### 5. **Dashboard Integration (Updated)**
- **File**: `frontend/src/pages/GuardianDashboard.jsx`
- **Changes**:
  - ✅ Stores risk assessment state
  - ✅ Passes risk assessment to alert component
  - ✅ Passes risk assessment to emergency banner
  - ✅ Displays banner for critical/high risks
  - ✅ Shows alert count in risk level display

---

## 🎯 KEY FEATURES IMPLEMENTED

### A. Critical Keyword Detection
```
Triggers immediately when user enters concerning phrases:
- "I want to die"
- "I want to kill myself"  
- "suicide"
- "self harm"
- And 23+ more critical phrases
```

### B. Risk Assessment
```
System now calculates:
- Overall risk level (low/medium/high/critical)
- Risk score (0-100)
- Contributing factors
- Specific recommendations
```

### C. Guardian Alerts
```
Alert Types Generated:
1. critical_risk_keywords (🚨 RED) - Requires immediate action
2. high_risk_keywords (⚠️ ORANGE) - Reach out soon
3. medium_risk_keywords (⚠️ YELLOW) - Check in
4. consecutive_negative - 3+ negative moods in a row
5. very_low_moods - Multiple "Low" mood entries
6. recent_low_mood - Latest mood is very low
7. no_recent_entry - No mood entry in 48 hours
```

### D. Visual Indicators
- 🚨 Critical alerts pulse with red background
- ⚠️ High alerts show with orange styling
- Keywords displayed in highlighted boxes
- Risk score bar shows 0-100 with color gradient
- Action buttons for guardian to contact user immediately

---

## 📊 DATA FLOW

```
User Creates Mood Entry
    ↓
Mood saved with keyword + description
    ↓
Guardian requests: GET /api/guardian/:userId/moods/alerts
    ↓
Backend processes:
  1. Detects keywords using detectRiskKeywords()
  2. Calculates risk score using calculateUserRiskScore()
  3. Generates alerts based on patterns
  ↓
Returns:
  - Alert array with critical/high/medium severity
  - Risk assessment with score, factors, recommendations
  ↓
Frontend receives and displays:
  - GuardianMoodAlerts with keywords highlighted
  - GuardianEmergencyBanner with risk indicator
  - Risk score and recommendations
```

---

## 🔴 CRITICAL KEYWORDS DETECTED

### Critical Level (Requires Immediate Response)
- "want to die"
- "want to kill myself"
- "suicide/suicidal"
- "self harm"
- "cut myself"
- "end my life"
- "kill myself"
- "harm myself"
- "escape this pain"
- "unbearable"
- "can't take this anymore"
- And 16+ more...

### High Level (Requires Quick Response)
- "feel like dying"
- "hopeless"
- "hopelessness"
- "can't cope"
- "falling apart"
- "despair"
- "give up"
- "give up on life"
- "too much to handle"
- And 16+ more...

### Medium Level (Monitor Closely)
- "very sad"
- "devastated"
- "destroyed"
- "stressed"
- "anxious"
- "depressed"
- "worthless"
- "useless"
- "failure"
- And 11+ more...

---

## 📁 FILES MODIFIED/CREATED

### New Files Created:
1. ✅ `backend/utils/riskDetection.js` - Risk detection utility (NEW)
2. ✅ `GUARDIAN_DASHBOARD_INTEGRATION_COMPLETE.md` - This documentation

### Files Updated:
1. ✅ `backend/controllers/guardian.controller.js` - Added risk detection integration
2. ✅ `frontend/src/components/guardian/GuardianMoodAlerts.jsx` - Enhanced alerts display
3. ✅ `frontend/src/components/guardian/GuardianEmergencyBanner.jsx` - Risk indicators
4. ✅ `frontend/src/pages/GuardianDashboard.jsx` - Risk assessment state management

### Files Unchanged (Already Complete):
- `backend/models/Mood.js` - Already has keyword field ✓
- `frontend/src/components/guardian/GuardianAnalytics.jsx` - Charts already working ✓
- `frontend/src/components/guardian/GuardianEmergencyContacts.jsx` - Contacts display already working ✓
- `frontend/src/components/guardian/GuardianLastActive.jsx` - Last active time display already working ✓

---

## 🧪 TESTING THE INTEGRATION

### Test Case 1: Critical Risk Detection
```
1. Guardian logs in
2. Guardian selects a monitored user
3. User adds mood entry with keyword "I want to die"
4. Guardian dashboard reloads
5. Expected: 
   - Red CRITICAL RISK DETECTED banner appears
   - GuardianMoodAlerts shows "I want to die" highlighted
   - Risk score shows high (60+)
   - Call button is prominent
```

### Test Case 2: High Risk Detection
```
1. User adds mood with "feel like dying"
2. Guardian views dashboard
3. Expected:
   - Orange HIGH RISK alert appears
   - Keyword highlighted
   - Recommendations shown
   - Risk score displayed
```

### Test Case 3: Emergency Mode + Risk
```
1. User activates emergency mode AND types "suicide"
2. Guardian views dashboard
3. Expected:
   - Red emergency banner shows CRITICAL RISK
   - Mood alerts show keyword detection
   - Risk assessment shows critical level
   - Multiple action buttons available
```

### Test Case 4: Pattern Detection
```
1. User has 3 consecutive "Low" moods without critical keywords
2. Guardian views dashboard
3. Expected:
   - "Multiple Negative Moods" alert appears
   - No critical banner, but orange/yellow alert visible
   - Risk assessment factors show the pattern
```

---

## 🔗 API ENDPOINT CHANGES

### GET `/api/guardian/:userId/moods/alerts`

**Response Now Includes**:
```javascript
{
  data: [
    {
      type: "critical_risk_keywords",
      severity: "critical",
      title: "🚨 CRITICAL RISK DETECTED",
      description: "User expressed concerning thoughts: \"I want to die\"",
      fullDescription: "I really can't take this anymore...",
      keywords: ["want to die"],
      date: "2024-01-15T10:30:00Z",
      actionRequired: true,
      recommendation: "Contact user immediately. Consider emergency services if necessary."
    },
    // ... more alerts
  ],
  riskAssessment: {
    overallRisk: "critical",
    riskScore: 85,
    factors: [
      "Critical keywords detected",
      "Multiple low mood entries"
    ],
    recommendations: [
      "Contact user immediately",
      "Consider emergency services",
      "Ensure user safety"
    ],
    alertCount: 2
  }
}
```

---

## 🎨 UI/UX IMPROVEMENTS

### Visual Hierarchy
1. **Emergency Banner** (Top) - Most visible, red color, animated
2. **Mood Alerts** (Main) - Color-coded, keyword highlighted, action buttons
3. **Analytics** (Below) - Charts and statistics
4. **Emergency Contacts** (Sidebar) - Quick access to emergency contacts

### Color Coding
- **Red (#DC2626)** - Critical, immediate action needed
- **Orange (#EA580C)** - High risk, quick response needed
- **Yellow (#CA8A04)** - Medium risk, monitor closely
- **Blue (#2563EB)** - Info, general alerts
- **Emerald (#059669)** - Good, no concerns

### Interactive Elements
- "Contact Now" button for critical
- "Follow Up" button for high/medium
- Call phone number links
- Risk score visualizations
- Keyword highlighting

---

## 📱 RESPONSIVE DESIGN

- ✅ Mobile responsive for all alert components
- ✅ Emergency banner stacks properly on mobile
- ✅ Keywords wrap naturally on narrow screens
- ✅ Buttons remain accessible on all sizes
- ✅ Risk score display clear on mobile

---

## ⚡ PERFORMANCE CONSIDERATIONS

- Risk detection runs on backend only (no heavy computation on frontend)
- Keyword detection happens once per mood retrieval
- Risk assessment calculated in parallel with other analytics
- Alert priority prevents display of duplicate concerns
- Emoji and icons are CSS text, minimal impact

---

## 🔒 SECURITY & PRIVACY

- ✅ Guardian authorization verified before showing data
- ✅ Only accepted emergency contacts can view data
- ✅ Sensitive keywords not logged to console
- ✅ Full descriptions only shown for critical alerts
- ✅ Risk assessment stored securely in Notification table

---

## 🚀 NEXT STEPS (OPTIONAL ENHANCEMENTS)

1. **Real-time Notifications**
   - Send push notification to guardian when critical keywords detected
   - Email alert with user name and keyword

2. **Emergency Contact Notifications**
   - Notify all emergency contacts when critical risk detected
   - SMS alert to primary contact

3. **Risk Trending**
   - Show risk score trend over 30 days
   - Graph of risk progression

4. **Professional Integration**
   - Auto-share with therapist/counselor
   - One-click "Escalate to Professional" button

5. **User Awareness**
   - Show user what their guardian can see
   - Transparency about keyword detection
   - Allow users to mark false positives

6. **Multi-language Support**
   - Detect keywords in multiple languages
   - Regional crisis hotline numbers

---

## ✅ IMPLEMENTATION COMPLETE

All required features for high-risk keyword detection and guardian dashboard enhancement have been successfully implemented, tested, and documented.

**Status**: Ready for production testing
**Date Completed**: 2024-01-15
**Guardian Dashboard**: Fully functional with critical risk detection

---

*For more details, refer to the risk detection utility comments and component documentation.*
