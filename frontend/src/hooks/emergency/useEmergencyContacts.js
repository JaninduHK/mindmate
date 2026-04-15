import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsAPI } from '../../api/emergency/contacts.api.js';
import toast from 'react-hot-toast';

/**
 * Hook for managing emergency contacts (CRUD operations)
 * @returns {object} Contacts list, mutations, and loading states
 */
export const useEmergencyContacts = () => {
  const queryClient = useQueryClient();

  // Get all contacts
  const { data: contactsData, isLoading } = useQuery({
    queryKey: ['emergencyContacts'],
    queryFn: () => contactsAPI.getContacts().then(res => res.data),
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to load contacts');
    },
  });

  const contacts = contactsData?.data || [];

  // Add contact
  const { mutate: addContact, isPending: isAdding } = useMutation({
    mutationFn: (contactData) => contactsAPI.addContact(contactData),
    onSuccess: () => {
      toast.success('Contact added successfully!');
      queryClient.invalidateQueries({ queryKey: ['emergencyContacts'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add contact');
    },
  });

  // Update contact
  const { mutate: updateContact, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }) => contactsAPI.updateContact(id, data),
    onSuccess: () => {
      toast.success('Contact updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['emergencyContacts'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update contact');
    },
  });

  // Delete contact
  const { mutate: deleteContact, isPending: isDeleting } = useMutation({
    mutationFn: (id) => contactsAPI.deleteContact(id),
    onSuccess: () => {
      toast.success('Contact deleted');
      queryClient.invalidateQueries({ queryKey: ['emergencyContacts'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete contact');
    },
  });

  // Resend invite
  const { mutate: resendInvite, isPending: isResending } = useMutation({
    mutationFn: (id) => contactsAPI.resendInvite(id),
    onSuccess: () => {
      toast.success('Invitation resent!');
      queryClient.invalidateQueries({ queryKey: ['emergencyContacts'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to resend invitation');
    },
  });

  return {
    contacts,
    isLoading,
    addContact,
    updateContact,
    deleteContact,
    resendInvite,
    isAdding,
    isUpdating,
    isDeleting,
    isResending,
  };
};