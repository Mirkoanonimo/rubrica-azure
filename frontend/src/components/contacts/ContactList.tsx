import React, { useState } from 'react';
import { Table } from '../common/Table';
import { Button } from '../common/Button';
import { AlertDialog } from '../common/AlertDialog';
import { ContactForm } from './ContactForm';
import useContacts from '../../hooks/useContacts';
import { Contact, ContactCreate, ContactFormMode } from '../../types/contacts';

export const ContactList: React.FC = () => {
  // States
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<ContactFormMode>(ContactFormMode.CREATE);
  
  // Custom hook per la gestione dei contatti
  const {
    contacts,
    selectedContact,
    isLoading,
    isDeleting,
    isCreating,
    isUpdating,
    selectContact,
    deleteContact,
    createContact,
    updateContact
  } = useContacts();

  // Definizione delle colonne della tabella
  const columns = [
    {
      key: 'first_name',
      header: 'Nome',
      sortable: true
    },
    {
      key: 'last_name',
      header: 'Cognome',
      sortable: true
    },
    {
      key: 'phone',
      header: 'Telefono'
    }
  ];

  // Form handlers
  const handleNew = () => {
    setFormMode(ContactFormMode.CREATE);
    setShowForm(true);
  };

  const handleEdit = () => {
    if (!selectedContact) {
      alert('Per modificare è necessario selezionare una persona');
      return;
    }
    setFormMode(ContactFormMode.EDIT);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: ContactCreate) => {
    try {
      if (formMode === ContactFormMode.CREATE) {
        await createContact(data);
      } else if (selectedContact) {
        await updateContact(selectedContact.id, data);
      }
      setShowForm(false);
      selectContact(null);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    if (formMode === ContactFormMode.EDIT) {
      selectContact(null);
    }
  };

  // Delete handlers
  const handleDelete = () => {
    if (!selectedContact) {
      alert('Per eliminare è necessario selezionare una persona');
      return;
    }
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedContact) {
      await deleteContact(selectedContact.id);
      setShowDeleteDialog(false);
    }
  };

  const handleRowClick = (contact: Contact) => {
    selectContact(selectedContact?.id === contact.id ? null : contact);
  };

  return (
    <div className="space-y-4">
      {/* Tabella contatti */}
      <Table
        columns={columns}
        data={contacts}
        selectedRow={selectedContact}
        onRowClick={handleRowClick}
        isLoading={isLoading}
        emptyMessage="Nessun contatto presente"
      />

      {/* Bottoni azioni */}
      <div className="flex gap-2">
        <Button onClick={handleNew}>
          Nuovo
        </Button>
        <Button 
          onClick={handleEdit}
          disabled={!selectedContact}
        >
          Modifica
        </Button>
        <Button 
          variant="danger"
          onClick={handleDelete}
          disabled={!selectedContact}
          isLoading={isDeleting}
        >
          Elimina
        </Button>
      </div>

      {/* Form Creazione/Modifica - modifichiamo questa parte */}
      <ContactForm
        open={showForm}
        onClose={handleFormClose}
        mode={formMode}
        contact={formMode === ContactFormMode.EDIT && selectedContact ? selectedContact : undefined}
        onSubmit={handleFormSubmit}
        isLoading={formMode === ContactFormMode.CREATE ? isCreating : isUpdating}
      />

      {/* Dialog conferma eliminazione */}
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Conferma Eliminazione"
        description={selectedContact 
          ? `Eliminare la persona ${selectedContact.first_name} ${selectedContact.last_name}?` 
          : ''
        }
        confirmLabel="Si"
        cancelLabel="No"
        onConfirm={handleConfirmDelete}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ContactList;