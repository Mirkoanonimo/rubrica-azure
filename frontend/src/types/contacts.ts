// Interfaccia base per un contatto
export interface Contact {
    id: number;
    first_name: string;    // nome richiesto
    last_name: string;     // cognome richiesto
    phone: string;         // telefono richiesto
    email: string;         // email opzionale
    address: string;       // indirizzo richiesto
    notes?: string;        // note opzionali
    favorite: boolean;     // flag preferiti
    owner_id: number;      // ID utente proprietario
    created_at: string;    // data creazione
    updated_at: string;    // data ultimo aggiornamento
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
export interface ContactUpdate extends Partial<ContactCreate> {}

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
    mode: ContactFormMode;
    contact?: Contact;
    onSubmit: (data: ContactCreate | ContactUpdate) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}