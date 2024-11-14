import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ContactList } from '@/components/contacts/ContactList';
import { ContactFilters } from '@/components/contacts/ContactFilters';
import { Button } from '@/components/common/Button';
import { useContacts } from '@/hooks/useContacts';
import { Pagination } from '@/components/common/Pagination';

const ContactListPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  
  const {
    contacts,
    totalPages,
    isLoading,
    isError,
    totalContacts,
  } = useContacts({
    page,
    size: 10,
    search,
    favorite: favoriteOnly
  });

  const handleFilterChange = (filters: { search: string; favoriteOnly: boolean }) => {
    setSearch(filters.search);
    setFavoriteOnly(filters.favoriteOnly);
    setPage(1); // Reset alla prima pagina quando cambiano i filtri
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleAddNew = () => {
    navigate('/contacts/new');
  };

  const handleEditContact = (id: number) => {
    navigate(`/contacts/${id}/edit`);
  };

  return (
    <MainLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">I tuoi contatti</h1>
          <Button onClick={handleAddNew}>
            Aggiungi contatto
          </Button>
        </div>

        <ContactFilters 
          onFilterChange={handleFilterChange}
          isLoading={isLoading}
        />

        {isError ? (
          <div className="text-center py-8">
            <p className="text-red-500">Si è verificato un errore nel caricamento dei contatti.</p>
          </div>
        ) : (
          <>
            <ContactList/>

            <div className="mt-6">
            <Pagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={handlePageChange}
  isLoading={isLoading}  // cambiato da disabled a isLoading
/>
              
              {totalContacts > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Totale contatti: {totalContacts}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default ContactListPage;