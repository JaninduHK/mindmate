import { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Users, Plus } from 'lucide-react';
import { useEmergencyContacts } from '../../../hooks/emergency/useEmergencyContacts.js';
import ContactCard from '../../../components/emergency/contacts/ContactCard.jsx';
import ContactFormModal from '../../../components/emergency/contacts/ContactFormModal.jsx';
import Button from '../../../components/common/Button.jsx';
import toast from 'react-hot-toast';

const EmergencyContactsPage = () => {
  const { contacts, isLoading, addContact, updateContact, deleteContact, resendInvite, isAdding, isDeleting, isResending } = useEmergencyContacts();
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  const handleAddClick = () => {
    setEditingContact(null);
    setShowModal(true);
  };

  const handleEditClick = (contact) => {
    setEditingContact(contact);
    setShowModal(true);
  };

  const handleSubmit = useCallback((formData) => {
    if (editingContact) {
      // Update contact
      updateContact(
        { id: editingContact._id, data: formData },
        {
          onSuccess: () => {
            setShowModal(false);
            setEditingContact(null);
          },
        }
      );
    } else {
      // Add new contact
      addContact(formData, {
        onSuccess: () => {
          setShowModal(false);
        },
      });
    }
  }, [editingContact, addContact, updateContact]);

  return (
    <>
      <Helmet>
        <title>Emergency Contacts - MindMate</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Users className="w-8 h-8 text-primary-600" />
                  Emergency Contacts
                </h1>
                <p className="text-gray-600 mt-2">
                  Manage the people who will be notified in case of an emergency.
                </p>
              </div>
              <Button
                onClick={handleAddClick}
                className="flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Contact
              </Button>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No Emergency Contacts Yet
              </h2>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                Add at least one emergency contact who will be notified when you need help.
              </p>
              <Button onClick={handleAddClick}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Contact
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contacts.map((contact) => (
                <ContactCard
                  key={contact._id}
                  contact={contact}
                  onEdit={handleEditClick}
                  onDelete={() => deleteContact(contact._id)}
                  onResendInvite={() => resendInvite(contact._id)}
                  isResending={isResending}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <ContactFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingContact(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingContact}
        isLoading={isAdding}
      />
    </>
  );
};

export default EmergencyContactsPage;
