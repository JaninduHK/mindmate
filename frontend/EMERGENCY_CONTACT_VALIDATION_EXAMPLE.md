# Emergency Contact Validation - Signup Form Example

This document shows the complete implementation of emergency contact validation on the signup form.

## Validation Rules

### 1. Full Name Field
- **Allowed characters**: Letters (A-Z, a-z) and spaces only
- **Invalid input message**: "Only letters are allowed"
- **Maximum characters**: 30
- **Max length error**: "Character limit exceeded (max 30)"
- **Real-time feedback**: Shows character count and validation status

### 2. Email Field
- **Required symbol**: @ symbol must be present
- **Missing @ error**: "Email must include @ symbol"
- **Maximum characters**: 50
- **Max length error**: "Email too long (max 50 characters)"
- **Format validation**: Must follow standard email format
- **Real-time feedback**: Shows character count and validation status

### 3. Phone Number Field
- **Format**: Sri Lankan phone numbers (+94XXXXXXXXX or 0XXXXXXXXX)
- **Invalid format error**: "Enter valid Sri Lankan phone number (+94XXXXXXXXX or 0XXXXXXXXX)"
- **Character restrictions**: No special characters other than +
- **Real-time feedback**: Validation status indicator

### 4. Relationship Field
- **Required**: Must select a relationship type
- **Error message**: "Relationship is required"
- **Options**: Sister, Brother, Mother, Father, Partner, Therapist, Friend, Other

## Form Submission Behavior

The "Create Account" button is **disabled** until:
1. All account information fields are valid (email, password match, etc.)
2. If emergency contact is enabled:
   - Full name is valid (letters/spaces only, max 30 chars)
   - Email is valid (must contain @, max 50 chars)
   - Phone number is valid (Sri Lankan format)
   - Relationship is selected

## React Component Structure

```jsx
// State Management
const [formData, setFormData] = useState({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  initialEmergencyContact: {
    fullName: '',
    email: '',
    phoneNumber: '',
    relationship: 'friend',
    enabled: false,
  },
});

const [emergencyContactErrors, setEmergencyContactErrors] = useState({});

// Validation Functions (from utils/emergencyContactValidation.js)
const validateName = (name) => {
  if (!name.trim()) return 'Name is required';
  if (!/^[a-zA-Z\s]*$/.test(name)) return 'Name can only contain letters and spaces';
  if (name.length > 30) return 'Character limit exceeded (max 30)';
  return null;
};

const validateEmail = (email) => {
  if (!email.trim()) return 'Email is required';
  if (!email.includes('@')) return 'Email must include @ symbol';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Enter a valid email format';
  if (email.length > 50) return 'Email too long (max 50 characters)';
  return null;
};

const validatePhone = (phone) => {
  if (!phone.trim()) return 'Phone number is required';
  const cleaned = phone.replace(/\s/g, '');
  const sriLankanRegex = /^(\+94|0)\d{9}$/;
  if (!sriLankanRegex.test(cleaned)) {
    return 'Enter valid Sri Lankan phone number (+94XXXXXXXXX or 0XXXXXXXXX)';
  }
  return null;
};

// Validate Emergency Contact
const validateEmergencyContact = () => {
  if (!formData.initialEmergencyContact.enabled) {
    return true;
  }

  const newErrors = {};
  const ec = formData.initialEmergencyContact;

  newErrors.fullName = validateName(ec.fullName);
  newErrors.phoneNumber = validatePhone(ec.phoneNumber);
  newErrors.email = validateEmail(ec.email);
  if (!ec.relationship) newErrors.relationship = 'Relationship is required';

  setEmergencyContactErrors(newErrors);
  return !Object.values(newErrors).some(err => err !== null);
};

// Handle Change Event
const handleEmergencyContactChange = (e) => {
  const { name, value, type, checked } = e.target;

  if (type === 'checkbox') {
    setFormData((prev) => ({
      ...prev,
      initialEmergencyContact: {
        ...prev.initialEmergencyContact,
        enabled: checked,
      },
    }));
  } else {
    setFormData((prev) => ({
      ...prev,
      initialEmergencyContact: {
        ...prev.initialEmergencyContact,
        [name]: value,
      },
    }));
  }

  // Clear error on change
  if (emergencyContactErrors[name]) {
    setEmergencyContactErrors((prev) => ({ ...prev, [name]: '' }));
  }
};

// Submit Handler
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) return;
  if (!validateEmergencyContact()) return; // All checks pass

  // Proceed with registration
  const registerData = {
    name: formData.name,
    email: formData.email,
    password: formData.password,
  };

  if (formData.initialEmergencyContact.enabled) {
    registerData.initialEmergencyContact = {
      fullName: formData.initialEmergencyContact.fullName,
      email: formData.initialEmergencyContact.email,
      phoneNumber: formData.initialEmergencyContact.phoneNumber,
      relationship: formData.initialEmergencyContact.relationship,
    };
  }

  const result = await register(registerData);
  
  if (result.success) {
    navigate('/dashboard');
  }
};
```

## JSX Form Markup

```jsx
{/* Emergency Contact Checkbox */}
<label className="flex items-center space-x-3 cursor-pointer mb-4">
  <input
    type="checkbox"
    checked={formData.initialEmergencyContact.enabled}
    onChange={handleEmergencyContactChange}
    className="w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
  />
  <span className="text-sm font-semibold text-gray-900">
    Add an Emergency Contact
  </span>
</label>

{formData.initialEmergencyContact.enabled && (
  <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
    <p className="text-xs text-blue-800 mb-3">
      Add a trusted person who will be notified during emergencies.
    </p>

    {/* Full Name Field */}
    <div className="relative">
      <FiUser className="absolute left-3 top-10 text-gray-400" />
      <Input
        label="Contact Full Name"
        type="text"
        name="fullName"
        value={formData.initialEmergencyContact.fullName}
        onChange={handleEmergencyContactChange}
        error={emergencyContactErrors.fullName}
        required={formData.initialEmergencyContact.enabled}
        className={`pl-10 ${
          emergencyContactErrors.fullName
            ? 'border-red-500 focus:ring-red-500'
            : formData.initialEmergencyContact.fullName && 
              !emergencyContactErrors.fullName
            ? 'border-green-500 focus:ring-green-500'
            : ''
        }`}
        placeholder="Jane Doe"
        maxLength="30"
      />
      {emergencyContactErrors.fullName && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <span>⚠️</span> {emergencyContactErrors.fullName}
        </p>
      )}
      {formData.initialEmergencyContact.fullName && 
       !emergencyContactErrors.fullName && (
        <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
          <span>✓</span> Valid name
        </p>
      )}
      <p className="mt-1 text-xs text-gray-500">
        {formData.initialEmergencyContact.fullName.length}/30 characters
      </p>
    </div>

    {/* Email Field */}
    <div className="relative">
      <FiMail className="absolute left-3 top-10 text-gray-400" />
      <Input
        label="Contact Email"
        type="email"
        name="email"
        value={formData.initialEmergencyContact.email}
        onChange={handleEmergencyContactChange}
        error={emergencyContactErrors.email}
        required={formData.initialEmergencyContact.enabled}
        className={`pl-10 ${
          emergencyContactErrors.email
            ? 'border-red-500 focus:ring-red-500'
            : formData.initialEmergencyContact.email && 
              !emergencyContactErrors.email
            ? 'border-green-500 focus:ring-green-500'
            : ''
        }`}
        placeholder="jane@example.com"
        maxLength="50"
      />
      {emergencyContactErrors.email && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <span>⚠️</span> {emergencyContactErrors.email}
        </p>
      )}
      {formData.initialEmergencyContact.email && 
       !emergencyContactErrors.email && (
        <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
          <span>✓</span> Valid email
        </p>
      )}
      <p className="mt-1 text-xs text-gray-500">
        {formData.initialEmergencyContact.email.length}/50 characters
      </p>
    </div>

    {/* Phone Field */}
    <div className="relative">
      <FiPhone className="absolute left-3 top-10 text-gray-400" />
      <Input
        label="Contact Phone"
        type="tel"
        name="phoneNumber"
        value={formData.initialEmergencyContact.phoneNumber}
        onChange={handleEmergencyContactChange}
        error={emergencyContactErrors.phoneNumber}
        required={formData.initialEmergencyContact.enabled}
        className={`pl-10 ${
          emergencyContactErrors.phoneNumber
            ? 'border-red-500 focus:ring-red-500'
            : formData.initialEmergencyContact.phoneNumber && 
              !emergencyContactErrors.phoneNumber
            ? 'border-green-500 focus:ring-green-500'
            : ''
        }`}
        placeholder="+94701234567"
        helperText="Sri Lankan format: +94XXXXXXXXX or 0XXXXXXXXX"
      />
      {emergencyContactErrors.phoneNumber && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <span>⚠️</span> {emergencyContactErrors.phoneNumber}
        </p>
      )}
      {formData.initialEmergencyContact.phoneNumber && 
       !emergencyContactErrors.phoneNumber && (
        <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
          <span>✓</span> Valid phone number
        </p>
      )}
    </div>

    {/* Relationship Field */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Relationship <span className="text-red-500">*</span>
      </label>
      <select
        name="relationship"
        value={formData.initialEmergencyContact.relationship}
        onChange={handleEmergencyContactChange}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none 
          focus:ring-2 focus:ring-primary-500 transition-colors ${
          emergencyContactErrors.relationship
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300'
        }`}
      >
        <option value="sister">Sister</option>
        <option value="brother">Brother</option>
        <option value="mother">Mother</option>
        <option value="father">Father</option>
        <option value="partner">Partner</option>
        <option value="therapist">Therapist</option>
        <option value="friend">Friend</option>
        <option value="other">Other</option>
      </select>
      {emergencyContactErrors.relationship && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <span>⚠️</span> {emergencyContactErrors.relationship}
        </p>
      )}
    </div>

    {/* Validation Summary Checklist */}
    <div className="mt-4 p-3 bg-white rounded border border-blue-200">
      <p className="text-xs font-semibold text-gray-700 mb-2">
        Validation Status:
      </p>
      <div className="space-y-1 text-xs">
        <div className={`flex items-center gap-2 ${
          !emergencyContactErrors.fullName && 
          formData.initialEmergencyContact.fullName
            ? 'text-green-600'
            : 'text-gray-600'
        }`}>
          <span>{
            !emergencyContactErrors.fullName && 
            formData.initialEmergencyContact.fullName
              ? '✓'
              : '○'
          }</span>
          Full Name (letters and spaces only, max 30 chars)
        </div>
        <div className={`flex items-center gap-2 ${
          !emergencyContactErrors.email && 
          formData.initialEmergencyContact.email
            ? 'text-green-600'
            : 'text-gray-600'
        }`}>
          <span>{
            !emergencyContactErrors.email && 
            formData.initialEmergencyContact.email
              ? '✓'
              : '○'
          }</span>
          Email (with @ symbol, max 50 chars)
        </div>
        <div className={`flex items-center gap-2 ${
          !emergencyContactErrors.phoneNumber && 
          formData.initialEmergencyContact.phoneNumber
            ? 'text-green-600'
            : 'text-gray-600'
        }`}>
          <span>{
            !emergencyContactErrors.phoneNumber && 
            formData.initialEmergencyContact.phoneNumber
              ? '✓'
              : '○'
          }</span>
          Phone (Sri Lankan format required)
        </div>
        <div className={`flex items-center gap-2 ${
          !emergencyContactErrors.relationship
            ? 'text-green-600'
            : 'text-gray-600'
        }`}>
          <span>{
            !emergencyContactErrors.relationship
              ? '✓'
              : '○'
          }</span>
          Relationship selected
        </div>
      </div>
    </div>
  </div>
)}

{/* Submit Button - Disabled If Emergency Contact Not Valid */}
<Button
  type="submit"
  fullWidth
  loading={loading}
  disabled={
    loading ||
    (formData.initialEmergencyContact.enabled &&
      (Object.values(emergencyContactErrors).some(err => err !== null) ||
        !formData.initialEmergencyContact.fullName ||
        !formData.initialEmergencyContact.email ||
        !formData.initialEmergencyContact.phoneNumber))
  }
>
  Create Account
</Button>
```

## User Experience Features

1. **Real-time Validation**: Errors appear as user types/changes input
2. **Visual Indicators**:
   - Red border for invalid fields
   - Green border + checkmark for valid fields
   - Gray border for untouched fields
3. **Character Counters**: Shows current/max characters for name and email
4. **Help Text**: Indicates required format (e.g., "Sri Lankan format: +94XXXXXXXXX")
5. **Validation Checklist**: Shows overall validation status
6. **Smart Submit**: Button disabled until all fields are valid
7. **Error Icons**: ⚠️ for errors, ✓ for valid fields

## Form Submission Process

If emergency contact is enabled:
1. User enters contact information
2. Real-time validation provides feedback
3. Submit button remains disabled until all fields pass validation
4. On form submit, validation runs again
5. If all validation passes, invitation email/SMS is sent to emergency contact
6. User is redirected to dashboard upon success
