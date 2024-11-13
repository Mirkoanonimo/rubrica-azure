import { axiosInstance } from './axios-instance';
import { 
  Contact,
  ContactCreate,
  ContactUpdate,
  ContactSearch,
  ContactListResponse
} from '../types/contacts';

const CONTACTS_URL = '/contacts';

export const contactsApi = {
  // GET /contacts - Recupera lista contatti paginata
  getContacts: async (
    page: number = 1,
    size: number = 10,
    search?: string,
    favorite?: boolean
  ): Promise<ContactListResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (search) params.append('search', search);
    if (favorite !== undefined) params.append('favorite', favorite.toString());

    const response = await axiosInstance.get(CONTACTS_URL, { params });
    return response.data;
  },

  // POST /contacts - Crea nuovo contatto
  createContact: async (contact: ContactCreate): Promise<Contact> => {
    const response = await axiosInstance.post(CONTACTS_URL, contact);
    return response.data;
  },

  // GET /contacts/{id} - Recupera singolo contatto
  getContact: async (id: number): Promise<Contact> => {
    const response = await axiosInstance.get(`${CONTACTS_URL}/${id}`);
    return response.data;
  },

  // PUT /contacts/{id} - Aggiorna contatto esistente
  updateContact: async (id: number, contact: ContactUpdate): Promise<Contact> => {
    const response = await axiosInstance.put(`${CONTACTS_URL}/${id}`, contact);
    return response.data;
  },

  // DELETE /contacts/{id} - Elimina contatto
  deleteContact: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${CONTACTS_URL}/${id}`);
  },

  // POST /contacts/search - Ricerca avanzata contatti
  searchContacts: async (params: ContactSearch): Promise<Contact[]> => {
    const response = await axiosInstance.post(`${CONTACTS_URL}/search`, params);
    return response.data;
  }
};