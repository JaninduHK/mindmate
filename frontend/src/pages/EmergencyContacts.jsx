import { useState } from 'react';
import { Plus, Edit2, Trash2, Send, Phone, Mail } from 'lucide-react';
import Button from '../components/common/Button.jsx';
import toast from 'react-hot-toast';

const EmergencyContacts = () => {
  const [contacts, setContacts] = useState([
    {
      id: 1,
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+1-234-567-8900',
      relationship: 'Brother',
      status: 'accepted',
    },
    {
      id: 2,
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1-234-567-8901',
      relationship: 'Sister',
      status: 'pending',
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    relationship: '',
  });

  const handleOpenForm = (contact = null) => {
    if (contact) {
      setFormData(contact);
      setEditingId(contact.id);
    } else {
      setFormData({ fullName: '', email: '', phone: '', relationship: '' });
      setEditingId(null);
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ fullName: '', email: '', phone: '', relationship: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.phone || !formData.relationship) {
      toast.error('All fields are required');
      return;
    }

    if (editingId) {
      setContacts((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, ...formData } : c))
      );
      toast.success('Contact updated successfully');
    } else {
      setContacts((prev) => [
        ...prev,
        {
          ...formData,
          id: Date.now(),
          status: 'pending',
        },
      ]);
      toast.success('Contact added successfully');
    }

    handleCloseForm();
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      setContacts((prev) => prev.filter((c) => c.id !== id));
      toast.success('Contact deleted');
    }
  };

  const handleResendInvite = (id) => {
    toast.success('Invitation resent');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Emergency Contacts</h1>
            <p className="text-gray-600 mt-2">
              Manage the people who will be notified in case of emergency
            </p>
          </div>
          <Button onClick={() => handleOpenForm()} variant="primary">
            <Plus className="w-4 h-4" />
            Add Contact
          </Button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingId ? 'Edit Contact' : 'Add Emergency Contact'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship
                  </label>
                  <select
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  >
                    <option value="">Select relationship</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Friend">Friend</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={handleCloseForm} fullWidth>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" fullWidth>
                    {editingId ? 'Update' : 'Add'} Contact
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Contacts List */}
        {contacts.length > 0 ? (
          <div className="space-y-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-white rounded-lg shadow p-6 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary-600">
                        {contact.fullName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{contact.fullName}</h3>
                      <p className="text-sm text-gray-600">{contact.relationship}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:text-primary-600">
                          <Mail className="w-4 h-4" />
                          {contact.email}
                        </a>
                        <a href={`tel:${contact.phone}`} className="flex items-center gap-1 hover:text-primary-600">
                          <Phone className="w-4 h-4" />
                          {contact.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mr-4">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                      contact.status === 'accepted'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {contact.status === 'accepted' ? '✓ Accepted' : 'Pending'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {contact.status === 'pending' && (
                    <button
                      onClick={() => handleResendInvite(contact.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Resend invitation"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenForm(contact)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Edit contact"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete contact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 mb-4">No emergency contacts added yet</p>
            <Button onClick={() => handleOpenForm()} variant="primary">
              <Plus className="w-4 h-4" />
              Add Your First Contact
            </Button>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">📌 Important</h3>
          <p className="text-blue-800 text-sm">
            Your emergency contacts will receive notifications via email and SMS when you activate
            emergency mode. Make sure to add trusted people who can respond quickly in times of
            crisis.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmergencyContacts;
