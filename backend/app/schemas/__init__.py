from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

# Schemi Tenant
class TenantBase(BaseModel):
    name: str

class TenantCreate(TenantBase):
    pass

class Tenant(TenantBase):
    id: int
    created_at: datetime
    active: bool

    class Config:
        from_attributes = True

# Schemi User
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    tenant_id: int

class User(UserBase):
    id: int
    tenant_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Schemi Contact
class ContactBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    notes: Optional[str] = None

class ContactCreate(ContactBase):
    pass

class ContactUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    notes: Optional[str] = None

class Contact(ContactBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
    full_name: str

    class Config:
        from_attributes = True

# Response Models
class TokenData(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    user: User
    tenant: Tenant

class ContactList(BaseModel):
    total: int
    items: List[Contact]