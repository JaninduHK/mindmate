export const validateName = (name) => {
  if (!name.trim()) return 'Name is required';
  if (!/^[a-zA-Z\s]*$/.test(name)) return 'Name can only contain letters and spaces';
  if (name.length > 30) return 'Character limit exceeded (max 30)';
  return null;
};

export const validatePhone = (phone) => {
  if (!phone.trim()) return 'Phone number is required';
  const cleaned = phone.replace(/\s/g, '');
  const sriLankanRegex = /^(\+94|0)\d{9}$/;
  if (!sriLankanRegex.test(cleaned)) {
    return 'Enter valid Sri Lankan phone number (+94XXXXXXXXX or 0XXXXXXXXX)';
  }
  return null;
};

export const validateEmail = (email) => {
  if (!email.trim()) return 'Email is required';
  if (!email.includes('@')) return 'Email must include @ symbol';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Enter a valid email format';
  if (email.length > 50) return 'Email too long (max 50 characters)';
  return null;
};
