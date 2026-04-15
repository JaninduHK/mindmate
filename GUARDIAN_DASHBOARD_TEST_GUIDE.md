# Guardian Dashboard Testing Guide

## Overview
The Guardian Dashboard allows guardians/emergency contacts to monitor users and view their wellness data including mood analytics, active sessions, and emergency contacts.

## System Requirements
- Both backend (port 5001) and frontend (port 5173) servers must be running
- Guardians must be invitations accepted by users

## How to Test the Guardian Dashboard

### Step 1: Create a Regular User Account
1. Go to `http://127.0.0.1:5173/register`
2. Fill in:
   - Name: "John Doe"
   - Email: "user@test.com"
   - Password: "TestPassword123"
3. Click "Sign Up"
4. You'll be redirected to Dashboard

### Step 2: Create a Guardian Account
1. Go to `http://127.0.0.1:5173/register`
2. Fill in:
   - Name: "Jane Guardian"
   - Email: "guardian@test.com"
   - Password: "GuardianPass123"
3. Click "Sign Up"
4. Logout

### Step 3: Add Guardian as Emergency Contact
1. Login as the regular user (user@test.com / TestPassword123)
2. Go to Dashboard → Emergency Contacts or find the Emergency Settings
3. Click "Add Emergency Contact"
4. Fill in the form:
   - Full Name: "Jane Guardian"
   - Email: "guardian@test.com"
   - Phone: "+1-555-0100"
   - Relationship: "Friend"
5. Submit - An invitation email will be sent

### Step 4: Guardian Accepts Invitation
1. **Check Email**: Look for invitation email sent to guardian@test.com
2. **Accept Invitation**: Click the link in the email or navigate to accept
3. Guardian account is now linked to the user

### Step 5: Guardian Logs In
1. Go to `http://127.0.0.1:5173/guardian-login`
2. Login with:
   - Email: "guardian@test.com"
   - Password: "GuardianPass123"
3. You'll be redirected to `/guardian-dashboard`

### Step 6: View Guardian Dashboard
Once logged in as guardian, you should see:

#### Dashboard Information Available:
- **User Active Time**: Last active timestamp of the monitored user
- **Mood Analytics**: Chart showing mood trends over the last 30 entries
- **Mood Details**: Current mood, keywords, and descriptions
- **Goals**: User's active and completed goals
- **Emergency Contacts**: List of other emergency contacts for the user
- **Risk Alerts**: Any high-risk alerts with trigger keywords

#### Dashboard Features:
- **User Selector**: If monitoring multiple users, select which user to view
- **Notifications**: Bell icon shows pending alerts
- **Emergency Alert**: If user activates emergency mode, you'll see prominent alert
- **Other Guardians**: View contact info of other guardians monitoring the same user
- **Sign Out**: Logout button in top-right

## Dashboard Data Display

### When Data is Available, You'll See:

#### Active Sessions Card
- User's current status
- Last active time
- Online/Offline indicator

#### Mood Analytics Chart
- Mood trend over past 30 days
- Mood types: Positive, Stable, Pressure, Low
- Interactive tooltips showing details

#### Goals Widget
- Active goals with progress
- Completed goals count
- Goal types

#### Emergency Contacts Section
- All contacts added by the user
- Contact relationship
- Phone and email
- Option to contact them

#### Risk Alert Banner (if applicable)
- Shows high-risk keywords detected
- Severity indicator
- Option to alert all other guardians

## Troubleshooting

### "No Monitored Users Yet" Message
This is normal when:
- The guardian hasn't been invited by any users yet
- Invitations haven't been accepted
- The user hasn't added the guardian as a contact

**Solution**: Follow steps 1-5 above to create a user and invite them.

### Authorization Error
If you see "Not authorized" errors:
- Make sure you logged in with the **guardian account** (the one that received the invitation)
- Dashboard must be accessed via `/guardian-login`, not regular login
- Check that your role is set to `emergency_contact`

### No Dashboard Data
If dashboard loads but shows empty state:
- The monitored user hasn't added any moods yet
- The monitored user hasn't created any goals yet
- This is expected for new accounts

**Solution**: Have the user login and:
- Add mood entries
- Create goals
- Then refresh the guardian dashboard

### Login Issues
If you can't login:
- Verify both servers are running
- Check Network tab in browser dev tools (F12)
- Look for 401 errors in console
- Verify email and password are correct

## Backend Setup (if needed)

If guardian routes give 403 errors:

1. **Check User Role**: Guardian account must have role = `emergency_contact`
2. **Check Emergency Contact Link**: EmergencyContact record must exist with:
   - `contactUserId` = Guardian's User ID
   - `ownerUserId` = Monitored User's ID
   - `inviteStatus` = "accepted"

## API Endpoints Used

Guardian Dashboard uses these endpoints:
- `GET /guardian/users-status` - List monitored users
- `GET /guardian/dashboard/:userId` - Get dashboard data for specific user
- `GET /guardian/users/:userId` - Get detailed user information
- `GET /guardian/users/:userId/emergency-contacts` - Get user's emergency contacts

All require `emergency_contact` role verification.

## Expected Dashboard Content

### User Information Card
- Name: John Doe
- Email: user@test.com
- Status: Online/Offline
- Last Active: [timestamp]

### Mood Analytics
- Chart showing mood values over time
- Color coded by mood type:
  - Green: Positive (8/10)
  - Blue: Stable (6/10)
  - Orange: Pressure (4/10)
  - Red: Low (2/10)

### Goals
- Title of goals
- Progress percentage
- Status: Active/Completed

### Emergency Contacts
Shows other people added as emergency contacts:
- Name
- Relationship (Friend, Family, etc.)
- Phone/Email
- Ability to contact them

## Notes

- Mood data is populated when users use the mood tracking feature
- Goals data comes from the user's personal goal-setting
- Emergency contacts are those added by the main user
- Currently must be manually added through Emergency Contacts page
- Real user data is used, not mock data

## Next Steps

To fully test the system:
1. ✅ Create test accounts (done via guide above)
2. ✅ Setup emergency contact relationship
3. ✅ Have user add mood entries
4. ✅ Have user create goals
5. ✅ View complete dashboard as guardian
6. ✅ Test emergency activation
7. ✅ View real-time updates

---

**Last Updated**: April 11, 2026
**Version**: 1.0 Guardian Dashboard
