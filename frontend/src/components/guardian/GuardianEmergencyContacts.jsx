import React from 'react';
import { Users, Phone, Mail } from 'lucide-react';

const GuardianEmergencyContacts = ({ contacts = [] }) => {
  if (!contacts || contacts.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Emergency Contacts</h2>
        </div>
        <p className="text-sm text-gray-500">No emergency contacts added.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900">Emergency Contacts</h2>
      </div>
      <div className="space-y-3">
        {contacts.map((contact) => (
          <div key={contact.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{contact.fullName || contact.name}</p>
              <p className="text-xs text-gray-500 capitalize">{contact.relationship}</p>
            </div>
            <div className="flex gap-2">
              {contact.phoneNumber && (
                <a
                  href={`tel:${contact.phoneNumber}`}
                  title={`Call ${contact.fullName || contact.name}`}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  title={`Email ${contact.fullName || contact.name}`}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GuardianEmergencyContacts;
