import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ContactForm } from '@/components/contacts/ContactForm';
import { Button } from '@/components/common/Button';
import { useContacts } from '@/hooks/useContacts';
import { ContactFormMode, ContactCreate, ContactUpdate } from '@/types/contacts';  // Aggiungi ContactCreate qui
import { useToast } from '@/hooks/useToast';

const ContactEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isNewContact = id === 'new';

  const {
    contacts,
    createContact,
    updateContact,
    isLoading,
    isCreating,
    isUpdating,
  } = useContacts();

  const currentContact = !isNewContact
    ? contacts.find(contact => contact.id === Number(id))
    : undefined;

  useEffect(() => {
    if (!isNewContact && !isLoading && !currentContact) {
      showToast('Contatto non trovato', 'error');
      navigate('/contacts');
    }
  }, [currentContact, isLoading, isNewContact, navigate, showToast]);

  const handleSubmit = async (data: ContactCreate) => {  // Specificato il tipo qui
    console.log('Contact edit form submitted:', data);
    try {
      if (isNewContact) {
        console.log('Creating new contact...');
        const success = await createContact(data);
        if (success) {
          showToast('Contatto creato con successo', 'success');
          navigate('/contacts');
        }
      } else if (id) {
        console.log('Updating contact:', id);
        const success = await updateContact(Number(id), data as ContactUpdate);  // Cast a ContactUpdate se necessario
        if (success) {
          showToast('Contatto aggiornato con successo', 'success');
          navigate('/contacts');
        }
      }
    } catch (error) {
      console.error('Contact operation error:', error);
      showToast(
        `Errore durante il ${isNewContact ? 'salvataggio' : 'aggiornamento'} del contatto: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
        'error'
      );
    }
  };

  const handleCancel = () => {
    navigate('/contacts');
  };

  if (isLoading) {
    return <div>Caricamento...</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          {isNewContact ? 'Nuovo contatto' : 'Modifica contatto'}
        </h1>
        <Button
          variant="secondary"
          onClick={handleCancel}
        >
          Annulla
        </Button>
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        <ContactForm
          mode={isNewContact ? ContactFormMode.CREATE : ContactFormMode.EDIT}
          contact={currentContact}
          onSubmit={handleSubmit}
          onClose={handleCancel}
          isLoading={isCreating || isUpdating}
          isPageMode={true}
        />
      </div>
    </div>
  );
};

export { ContactEditPage }; 