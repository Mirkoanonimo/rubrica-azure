from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body, status
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import or_, func, text
import logging
from datetime import datetime, timezone
from app.core.security import require_auth
from app.models.base import get_db
from app.models.models import Contact, User
from app.schemas.contacts import (
    ContactCreate, 
    ContactUpdate, 
    ContactResponse,
    ContactSearch,
    ContactListResponse
)
from app.core.config import settings

# Configurazione logger
logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("", response_model=ContactListResponse)
async def get_contacts(
    page: int = Query(1, ge=1, description="Numero pagina"),
    size: int = Query(10, ge=1, le=settings.MAX_PAGE_SIZE, description="Elementi per pagina"),
    search: Optional[str] = Query(None, min_length=1, max_length=100),
    favorite: Optional[bool] = Query(None),
    current_user_id: int = Depends(require_auth),
    db: Session = Depends(get_db)
) -> ContactListResponse:
    """Recupera la lista dei contatti con paginazione e filtri."""
    try:
        # Base query
        query = db.query(Contact).filter(Contact.owner_id == current_user_id)

        # Filtro preferiti
        if favorite is not None:
            query = query.filter(Contact.favorite == favorite)

        # Ricerca
        if search:
            search_lower = search.lower()
            if settings.IS_DEVELOPMENT:
                query = query.filter(
                    or_(
                        Contact.first_name.ilike(f"%{search}%"),
                        Contact.last_name.ilike(f"%{search}%"),
                        Contact.email.ilike(f"%{search}%"),
                        Contact.phone.ilike(f"%{search}%")
                    )
                )
            else:
                query = query.filter(
                    or_(
                        func.lower(Contact.first_name).like(f"%{search_lower}%"),
                        func.lower(Contact.last_name).like(f"%{search_lower}%"),
                        func.lower(Contact.email).like(f"%{search_lower}%"),
                        func.lower(Contact.phone).like(f"%{search_lower}%")
                    )
                )

        # Conteggio totale
        total = query.count()
        
        # Paginazione
        contacts = query.order_by(Contact.last_name, Contact.first_name)\
                      .offset((page - 1) * size)\
                      .limit(size)\
                      .all()

        return ContactListResponse(
            items=contacts,
            total=total,
            page=page,
            size=size,
            pages=(total + size - 1) // size
        )

    except Exception as e:
        logger.error(f"Error fetching contacts: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore nel recupero dei contatti"
        )

@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(
    contact_in: ContactCreate,
    current_user_id: int = Depends(require_auth),
    db: Session = Depends(get_db)
) -> ContactResponse:
    """Crea un nuovo contatto."""
    try:
        current_time = datetime.now(timezone.utc)
        contact = Contact(
            **contact_in.model_dump(),
            owner_id=current_user_id,
            created_at=current_time,
            updated_at=current_time
        )
        
        db.add(contact)
        db.commit()
        db.refresh(contact)
        
        logger.info(f"Contact created successfully: {contact.id}")
        return contact
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating contact: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore nella creazione del contatto"
        )

@router.get("/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: int = Path(..., gt=0),
    current_user_id: int = Depends(require_auth),
    db: Session = Depends(get_db)
) -> ContactResponse:
    """Recupera un contatto specifico."""
    try:
        contact = db.query(Contact).filter(
            Contact.id == contact_id,
            Contact.owner_id == current_user_id
        ).first()
        
        if not contact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Contatto non trovato"
            )
        
        return contact
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching contact {contact_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore nel recupero del contatto"
        )

@router.put("/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: int = Path(..., gt=0),
    contact_in: ContactUpdate = Body(...),
    current_user_id: int = Depends(require_auth),
    db: Session = Depends(get_db)
) -> ContactResponse:
    """Aggiorna un contatto esistente."""
    try:
        contact = db.query(Contact).filter(
            Contact.id == contact_id,
            Contact.owner_id == current_user_id
        ).first()
        
        if not contact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Contatto non trovato"
            )
        
        update_data = contact_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(contact, field, value)
        
        contact.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(contact)
        
        logger.info(f"Contact updated: {contact_id}")
        return contact
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating contact {contact_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore nell'aggiornamento del contatto"
        )

@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: int = Path(..., gt=0),
    current_user_id: int = Depends(require_auth),
    db: Session = Depends(get_db)
):
    """Elimina un contatto."""
    try:
        result = db.query(Contact).filter(
            Contact.id == contact_id,
            Contact.owner_id == current_user_id
        ).delete()
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Contatto non trovato"
            )
        
        db.commit()
        logger.info(f"Contact deleted: {contact_id}")
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting contact {contact_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore nell'eliminazione del contatto"
        )

@router.post("/search", response_model=List[ContactResponse])
async def search_contacts(
    search_params: ContactSearch = Body(...),
    current_user_id: int = Depends(require_auth),
    db: Session = Depends(get_db)
) -> List[ContactResponse]:
    """Ricerca avanzata dei contatti."""
    try:
        query = db.query(Contact).filter(Contact.owner_id == current_user_id)
        
        if search_params.favorite_only:
            query = query.filter(Contact.favorite == True)
        
        search = search_params.query.lower()
        if settings.IS_DEVELOPMENT:
            query = query.filter(
                or_(
                    Contact.first_name.ilike(f"%{search}%"),
                    Contact.last_name.ilike(f"%{search}%"),
                    Contact.email.ilike(f"%{search}%"),
                    Contact.phone.ilike(f"%{search}%")
                )
            )
        else:
            query = query.filter(
                or_(
                    func.lower(Contact.first_name).like(f"%{search}%"),
                    func.lower(Contact.last_name).like(f"%{search}%"),
                    func.lower(Contact.email).like(f"%{search}%"),
                    func.lower(Contact.phone).like(f"%{search}%")
                )
            )
        
        return query.order_by(Contact.last_name, Contact.first_name).all()
    except Exception as e:
        logger.error(f"Error searching contacts: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore nella ricerca dei contatti"
        )