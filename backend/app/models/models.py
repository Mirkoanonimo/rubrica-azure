from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, DateTime, Text, Index, UniqueConstraint, func
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base
from typing import List
from app.core.config import settings

class Tenant(Base):
    """
    Modello per i tenant (organizzazioni).
    Ogni utente appartiene a un tenant per supportare multi-tenancy.
    """
    __tablename__ = "tenants"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    active = Column(Boolean, default=True, nullable=False)
    
    # Relazioni
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    
    # Indici ottimizzati per SQL Server
    __table_args__ = (
        Index('ix_tenants_name', 'name'),
        Index('ix_tenants_active', 'active'),
    )

class User(Base):
    """
    Modello per gli utenti.
    Gestisce autenticazione e proprietà dei contatti.
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String(255), nullable=False)
    username = Column(String(50), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime, nullable=True)
    
    # Relazioni
    tenant = relationship("Tenant", back_populates="users")
    contacts = relationship("Contact", back_populates="owner", cascade="all, delete-orphan")
    
    # Indici ottimizzati per SQL Server
    __table_args__ = (
        Index('ix_users_email', 'email', unique=True),
        Index('ix_users_username', 'username', unique=True),
        Index('ix_users_tenant', 'tenant_id'),
        Index('ix_users_active', 'is_active'),
    )
    
    def update_last_login(self) -> None:
        """Aggiorna il timestamp dell'ultimo login"""
        self.last_login = datetime.utcnow()
    
    def get_contacts(self) -> List["Contact"]:
        """Recupera tutti i contatti dell'utente"""
        from .base import SessionLocal
        with SessionLocal() as db:
            return db.query(Contact).filter(
                Contact.owner_id == self.id
            ).order_by(Contact.last_name, Contact.first_name).all()

class Contact(Base):
    """
    Modello per i contatti della rubrica.
    Ogni contatto appartiene a un utente specifico.
    """
    __tablename__ = "contacts"
    
    id = Column(Integer, primary_key=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(255))
    phone = Column(String(20))
    address = Column(String(255))
    notes = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    favorite = Column(Boolean, default=False, nullable=False)
    
    # Relazioni
    owner = relationship("User", back_populates="contacts")
    
    # Indici ottimizzati per SQL Server
    __table_args__ = (
        Index('ix_contacts_owner', 'owner_id'),
        Index('ix_contacts_email', 'email'),
        Index('ix_contacts_names', 'last_name', 'first_name'),
        Index('ix_contacts_favorite', 'favorite'),
    )
    
    @property
    def full_name(self) -> str:
        """Restituisce il nome completo del contatto"""
        return f"{self.first_name} {self.last_name}"
    
    def to_dict(self) -> dict:
        """Override del metodo to_dict per includere campi calcolati"""
        data = {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'notes': self.notes,
            'favorite': self.favorite,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'full_name': self.full_name
        }
        return data

    @classmethod
    def search(cls, owner_id: int, query: str) -> List["Contact"]:
        """
        Metodo di ricerca ottimizzato per SQL Server
        """
        from sqlalchemy import or_
        from .base import SessionLocal
        
        # SQL Server usa LIKE invece di ILIKE
        like_pattern = f"%{query}%" if settings.IS_DEVELOPMENT else f"%{query}%"
        
        with SessionLocal() as db:
            base_query = db.query(cls).filter(cls.owner_id == owner_id)
            
            if settings.IS_DEVELOPMENT:
                # PostgreSQL (development)
                search_filter = or_(
                    cls.first_name.ilike(like_pattern),
                    cls.last_name.ilike(like_pattern),
                    cls.email.ilike(like_pattern),
                    cls.phone.ilike(like_pattern)
                )
            else:
                # SQL Server (production)
                search_filter = or_(
                    func.lower(cls.first_name).like(func.lower(like_pattern)),
                    func.lower(cls.last_name).like(func.lower(like_pattern)),
                    func.lower(cls.email).like(func.lower(like_pattern)),
                    func.lower(cls.phone).like(func.lower(like_pattern))
                )
            
            return base_query.filter(search_filter)\
                           .order_by(cls.last_name, cls.first_name)\
                           .all()