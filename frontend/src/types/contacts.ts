// /types/contacts.ts

// Interfaccia base per un contatto
export interface Contact {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    address: string;
    notes?: string;
    favorite: boolean;
    owner_id: number;
    created_at: string;
    updated_at: string;
  }
  
  // Interfaccia per la creazione di un nuovo contatto
  export interface ContactCreate {
    first_name: string;
    last_name: string;
    phone: string;
    email?: string;
    address: string;
    notes?: string;
    favorite?: boolean;
  }
  
  // Interfaccia per l'aggiornamento di un contatto esistente
  export type ContactUpdate = Partial<ContactCreate>;
  
  // Interfaccia per i parametri di ricerca
  export interface ContactSearch {
    query: string;
    favorite_only?: boolean;
  }
  
  // Interfaccia per la risposta paginata
  export interface ContactListResponse {
    items: Contact[];
    total: number;
    page: number;
    size: number;
    pages: number;
  }
  
  // Enum per le modalità del form contatto
  export enum ContactFormMode {
    CREATE = 'create',
    EDIT = 'edit'
  }
  
  // Interfaccia per le props del form contatto
  export interface ContactFormProps {
    open?: boolean;  // Aggiunto per supportare la modalità modale
    onClose?: () => void;  // Aggiunto per supportare la modalità modale
    mode: ContactFormMode;
    contact?: Contact;
    onSubmit: (data: ContactCreate) => Promise<void>;  // Semplificato per essere più specifico
    isLoading?: boolean;
    isPageMode?: boolean;  // Aggiunto per supportare la modalità pagina intera
  }
  
  // Tipo per le opzioni di filtro dei contatti
  export interface ContactFilterOptions {
    page?: number;
    size?: number;
    search?: string;
    favorite?: boolean;
  }
  
  // Utils type per la risposta delle mutations
  export type ContactMutationResponse = {
    success: boolean;
    message?: string;
    error?: string;
  };
  
  // Utils type per gli errori specifici dei contatti
  export type ContactValidationError = {
    field: keyof ContactCreate;
    message: string;
  };