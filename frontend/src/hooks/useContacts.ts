import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi } from '../api/contacts';
import { Contact, ContactCreate, ContactUpdate } from '../types/contacts';
import useToast from './useToast';

interface UseContactsOptions {
  page?: number;
  size?: number;
  search?: string;
  favorite?: boolean;
}

export const useContacts = (options: UseContactsOptions = {}) => {
  const { page = 1, size = 10, search, favorite } = options;
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Query per ottenere la lista dei contatti
  const {
    data: contactsData,
    isPending: isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['contacts', page, size, search, favorite],
    queryFn: () => contactsApi.getContacts(page, size, search, favorite)
  });

  // Mutation per creare un contatto
  const createMutation = useMutation({
    mutationFn: contactsApi.createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      showToast('Contatto creato con successo', 'success');
      refetch();
    },
    onError: (error) => {
      showToast('Errore durante la creazione del contatto', 'error');
      console.error('Create contact error:', error);
    }
  });

  // Mutation per aggiornare un contatto
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ContactUpdate }) => 
      contactsApi.updateContact(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      showToast('Contatto aggiornato con successo', 'success');
      refetch();
    },
    onError: (error) => {
      showToast('Errore durante l\'aggiornamento del contatto', 'error');
      console.error('Update contact error:', error);
    }
  });

  // Mutation per eliminare un contatto
  const deleteMutation = useMutation({
    mutationFn: contactsApi.deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setSelectedContact(null);
      showToast('Contatto eliminato con successo', 'success');
      refetch();
    },
    onError: (error) => {
      showToast('Errore durante l\'eliminazione del contatto', 'error');
      console.error('Delete contact error:', error);
    }
  });

  // Handler per la creazione di un contatto
  const createContact = useCallback(async (data: ContactCreate) => {
    console.log('Creating contact with data:', data);
    try {
      const result = await createMutation.mutateAsync(data);
      console.log('Create contact result:', result);
      return true;
    } catch (error) {
      console.error('Create contact error:', error);
      throw error; // Propaga l'errore invece di ritornare false
    }
  }, [createMutation]);

  // Handler per l'aggiornamento di un contatto
  const updateContact = useCallback(async (id: number, data: ContactUpdate) => {
    console.log('Updating contact with id:', id, 'data:', data);
    try {
      const result = await updateMutation.mutateAsync({ id, data });
      console.log('Update contact result:', result);
      return true;
    } catch (error) {
      console.error('Update contact error:', error);
      throw error; // Propaga l'errore invece di ritornare false
    }
  }, [updateMutation]);

  // Handler per l'eliminazione di un contatto
  const deleteContact = useCallback(async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (error) {
      return false;
    }
  }, [deleteMutation]);

  // Handler per la selezione di un contatto
  const selectContact = useCallback((contact: Contact | null) => {
    setSelectedContact(contact);
  }, []);

  return {
    // Dati
    contacts: contactsData?.items ?? [],
    totalContacts: contactsData?.total ?? 0,
    totalPages: contactsData?.pages ?? 0,
    currentPage: page,
    selectedContact,

    // Loading states
    isLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Error states
    isError,
    error,

    // Actions
    createContact,
    updateContact,
    deleteContact,
    selectContact,
    refetchContacts: refetch
  };
};

export default useContacts;