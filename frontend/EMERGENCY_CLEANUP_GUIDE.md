# Emergency System Cleanup Guide

## Issue Found
There are **DUPLICATE emergency files** in old locations that need to be DELETED. The correctly organized files already exist in the new `emergency` folder structure.

## Status
✅ **App.jsx** - Already using correct new paths  
✅ **Header.jsx** - Already using correct new paths  

## Files to DELETE (Old Duplicates with Wrong Imports)

### ❌ OLD PAGE FILES (DELETE THESE)
These files in `src/pages/` have INCORRECT imports and should be removed:

```
src/pages/EmergencyContactsPage.jsx         ← DELETE (imports from ../hooks/useEmergencyContacts - WRONG)
src/pages/NotificationsPage.jsx             ← DELETE (imports from ../hooks/useNotifications - WRONG)
src/pages/ProfileSettingsPage.jsx           ← DELETE (imports from ../hooks/useContent - WRONG)
src/pages/ContentLibraryPage.jsx            ← DELETE (imports incorrectly)
src/pages/InvitationAcceptPage.jsx          ← DELETE (imports incorrectly)
src/pages/GuardianDashboardPage.jsx         ← DELETE (imports incorrectly)
```

### ❌ OLD HOOK FILES (DELETE THESE)
These files in `src/hooks/` are old duplicates and should be removed:

```
src/hooks/useEmergencyMode.js               ← DELETE (old location)
src/hooks/useEmergencyContacts.js           ← DELETE (old location)
src/hooks/useNotifications.js               ← DELETE (old location)
src/hooks/useContent.js                     ← DELETE (old location)
src/hooks/useGuardianSummary.js             ← DELETE (old location)
```

### ❌ OLD COMPONENT FILES (DELETE THESE)
These files in `src/components/emergency/` (root) are old duplicates:

```
src/components/emergency/EmergencyBanner.jsx        ← DELETE (moved to emergency/)
src/components/emergency/EmergencyButton.jsx        ← DELETE (moved to emergency/)
src/components/emergency/EmergencyConfirmModal.jsx  ← DELETE (moved to emergency/)
src/components/emergency/EmergencyActiveModal.jsx   ← DELETE (moved to emergency/)
```

---

## ✅ CORRECT FILES (These exist and are properly organized)

### Pages (Complete - correctly located)
```
src/pages/emergency/contacts/EmergencyContactsPage.jsx       ✅ CORRECT
src/pages/emergency/notifications/NotificationsPage.jsx      ✅ CORRECT
src/pages/emergency/settings/ProfileSettingsPage.jsx        ✅ CORRECT
src/pages/emergency/content/ContentLibraryPage.jsx          ✅ CORRECT
src/pages/emergency/invitation/InvitationAcceptPage.jsx     ✅ CORRECT
src/pages/emergency/guardian/GuardianDashboardPage.jsx      ✅ CORRECT
```

### Hooks (Complete - correctly located)
```
src/hooks/emergency/useEmergencyMode.js      ✅ CORRECT
src/hooks/emergency/useEmergencyContacts.js  ✅ CORRECT
src/hooks/emergency/useNotifications.js      ✅ CORRECT
src/hooks/emergency/useContent.js            ✅ CORRECT
src/hooks/emergency/useGuardianSummary.js    ✅ CORRECT
```

### Components (Complete - correctly organized in subfolders)
```
src/components/emergency/emergency/EmergencyBanner.jsx       ✅ CORRECT
src/components/emergency/emergency/EmergencyButton.jsx       ✅ CORRECT
src/components/emergency/emergency/EmergencyConfirmModal.jsx ✅ CORRECT
src/components/emergency/emergency/EmergencyActiveModal.jsx  ✅ CORRECT
src/components/emergency/contacts/ContactCard.jsx           ✅ CORRECT
src/components/emergency/contacts/ContactFormModal.jsx      ✅ CORRECT
src/components/emergency/content/ContentCard.jsx            ✅ CORRECT
src/components/emergency/notifications/NotificationItem.jsx  ✅ CORRECT
src/components/emergency/notifications/NotificationList.jsx  ✅ CORRECT
```

---

## Cleanup Instructions

### Option 1: Delete via VS Code (Recommended)
1. Open each file listed under "❌ OLD FILES (DELETE THESE)" sections above
2. Right-click → Delete or press `Delete` key
3. Confirm deletion

### Option 2: Delete via Terminal
```powershell
# From frontend directory
rm src/pages/EmergencyContactsPage.jsx
rm src/pages/NotificationsPage.jsx
rm src/pages/ProfileSettingsPage.jsx
rm src/pages/ContentLibraryPage.jsx
rm src/pages/InvitationAcceptPage.jsx
rm src/pages/GuardianDashboardPage.jsx

rm src/hooks/useEmergencyMode.js
rm src/hooks/useEmergencyContacts.js
rm src/hooks/useNotifications.js
rm src/hooks/useContent.js
rm src/hooks/useGuardianSummary.js

rm src/components/emergency/EmergencyBanner.jsx
rm src/components/emergency/EmergencyButton.jsx
rm src/components/emergency/EmergencyConfirmModal.jsx
rm src/components/emergency/EmergencyActiveModal.jsx
```

---

## Final Structure After Cleanup

```
frontend/src/
├── pages/
│   ├── (other pages)
│   └── emergency/              ← ALL emergency pages here
│       ├── contacts/
│       ├── notifications/
│       ├── settings/
│       ├── content/
│       ├── invitation/
│       └── guardian/
├── hooks/
│   ├── (other hooks)
│   └── emergency/              ← ALL emergency hooks here
│       ├── useEmergencyMode.js
│       ├── useEmergencyContacts.js
│       ├── useNotifications.js
│       ├── useContent.js
│       └── useGuardianSummary.js
├── components/
│   └── emergency/              ← ALL emergency components here
│       ├── emergency/          ← Core emergency controls
│       ├── contacts/           ← Contact management
│       ├── content/            ← Content library
│       └── notifications/      ← Notification components
└── (other folders)
```

---

## Verification

✅ App.jsx imports: All point to `./pages/emergency/...`  
✅ Header.jsx imports: Points to `../emergency/emergency/EmergencyButton`  
✅ No broken references in codebase  

**After deleting the old files, your emergency system will be completely organized!**
