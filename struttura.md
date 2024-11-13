 mirko@Mirko-Deb:~/Scrivania/Turing/Rubrica/rubrica-azure$ ls
azure-pipelines.yml  backend  create-frontend.sh  frontend  __init__.py  struttura.md  terraform  tests  venv

mirko@Mirko-Deb:~/Scrivania/Turing/Rubrica/rubrica-azure/frontend$ ls
index.html    package.json       postcss.config.js  src                 tsconfig.json       vite.config.ts
node_modules  package-lock.json  public             tailwind.config.js  tsconfig.node.json
(venv) mirko@Mirko-Deb:~/Scrivania/Turing/Rubrica/rubrica-azure/frontend$ tree src
src
├── api
│   ├── auth.ts
│   ├── axios-instance.ts
│   └── contacts.ts
├── App.tsx
├── components
│   ├── auth
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── common
│   │   ├── AlertDialog.tsx
│   │   ├── Button.tsx
│   │   ├── Form.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Pagination.tsx
│   │   ├── Table.tsx
│   │   ├── ToastContainer.tsx
│   │   └── Toast.tsx
│   ├── contacts
│   │   ├── ContactFilters.tsx
│   │   ├── ContactForm.tsx
│   │   └── ContactList.tsx
│   ├── layout
│   │   ├── Header.tsx
│   │   ├── MainLayout.tsx
│   │   └── Sidebar.tsx
│   └── TestComponent.tsx
├── contexts
│   └── AuthContext.tsx
├── hooks
│   ├── useAuth.ts
│   ├── useContacts.ts
│   └── useToast.ts
├── index.d.ts
├── index.postcss
├── main.tsx
├── pages
│   ├── auth
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── contacts
│   │   ├── ContactEditPage.tsx
│   │   └── ContactListPage.tsx
│   └── NotFoundPage.tsx
├── routes.tsx
├── types
│   ├── auth.ts
│   └── contacts.ts
├── utils
│   ├── token.ts
│   └── validation.ts
└── vite-env.d.ts

14 directories, 40 files


mirko@Mirko-Deb:~/Scrivania/Turing/Rubrica/rubrica-azure/backend$ ls
alembic.ini  app  __init__.py  migrations  package-lock.json  __pycache__  requirements.txt  rubrica_backend.egg-info  setup.py
(venv) mirko@Mirko-Deb:~/Scrivania/Turing/Rubrica/rubrica-azure/backend$ tree app
app
├── api
│   ├── __init__.py
│   ├── __pycache__
│   │   └── __init__.cpython-311.pyc
│   └── v1
│       ├── auth.py
│       ├── contacts.py
│       ├── endpoint_tests.log
│       ├── __init__.py
│       └── __pycache__
│           ├── auth.cpython-311.pyc
│           ├── contacts.cpython-311.pyc
│           └── __init__.cpython-311.pyc
├── core
│   ├── config.py
│   ├── __init__.py
│   ├── __pycache__
│   │   ├── config.cpython-311.pyc
│   │   ├── __init__.cpython-311.pyc
│   │   └── security.cpython-311.pyc
│   └── security.py
├── __init__.py
├── main.py
├── models
│   ├── base.py
│   ├── __init__.py
│   ├── models.py
│   └── __pycache__
│       ├── base.cpython-311.pyc
│       ├── __init__.cpython-311.pyc
│       └── models.cpython-311.pyc
├── __pycache__
│   ├── __init__.cpython-311.pyc
│   └── main.cpython-311.pyc
└── schemas
    ├── auth.py
    ├── contacts.py
    ├── __init__.py
    └── __pycache__
        ├── auth.cpython-311.pyc
        ├── contacts.cpython-311.pyc
        └── __init__.cpython-311.pyc

12 directories, 31 files