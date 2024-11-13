#!/bin/bash

# Crea la directory principale
mkdir -p frontend
cd frontend

# Crea la struttura delle directory e i file in src
mkdir -p src/{api,components/{common,auth,contacts,layout},contexts,hooks,pages/{auth,contacts},types,utils}

# Crea i file in api
touch src/api/{auth,contacts,axios-instance}.ts

# Crea i file in components/common
touch src/components/common/{Button,Input,Modal,Table,Form}.tsx

# Crea i file in components/auth
touch src/components/auth/{LoginForm,RegisterForm}.tsx

# Crea i file in components/contacts
touch src/components/contacts/{ContactList,ContactForm,ContactFilters}.tsx

# Crea i file in components/layout
touch src/components/layout/{Header,Sidebar,MainLayout}.tsx

# Crea i file in contexts
touch src/contexts/AuthContext.tsx

# Crea i file in hooks
touch src/hooks/{useAuth,useContacts,useToast}.ts

# Crea i file in pages/auth
touch src/pages/auth/{LoginPage,RegisterPage}.tsx

# Crea i file in pages/contacts
touch src/pages/contacts/{ContactListPage,ContactEditPage}.tsx

# Crea NotFoundPage
touch src/pages/NotFoundPage.tsx

# Crea i file in types
touch src/types/{auth,contacts}.ts

# Crea i file in utils
touch src/utils/{token,validation}.ts

# Crea i file principali in src
touch src/{App,main,routes}.tsx

# Crea la directory public
mkdir -p public

# Crea i file di configurazione nella root
touch {.env,.env.development,index.html,package.json,tsconfig.json,vite.config.ts,tailwind.config.js}

# Imposta i permessi corretti
chmod +x src/**/*.{ts,tsx}

echo "Struttura del progetto frontend creata con successo!"

# Output della struttura creata
tree
