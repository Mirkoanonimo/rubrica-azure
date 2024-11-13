from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.contacts import router as contacts_router

# Router principale per /api/v1
api_router = APIRouter()

# Inclusione dei sub-router con i loro prefissi
api_router.include_router(
    auth_router,
    prefix="/auth",
    tags=["Authentication"],
    responses={
        401: {"description": "Non autenticato"},
        403: {"description": "Operazione non permessa"},
        404: {"description": "Non trovato"},
        422: {"description": "Errore di validazione"},
        500: {"description": "Errore interno del server"},
    }
)

api_router.include_router(
    contacts_router,
    prefix="/contacts",
    tags=["Contacts"],
    responses={
        401: {"description": "Non autenticato"},
        403: {"description": "Operazione non permessa"},
        404: {"description": "Contatto non trovato"},
        422: {"description": "Errore di validazione"},
        500: {"description": "Errore interno del server"},
    }
)

# Metadati per OpenAPI/Swagger
tags_metadata = [
    {
        "name": "Authentication",
        "description": "Operazioni di autenticazione e gestione utenti",
    },
    {
        "name": "Contacts",
        "description": "Operazioni CRUD per la gestione dei contatti",
    },
]