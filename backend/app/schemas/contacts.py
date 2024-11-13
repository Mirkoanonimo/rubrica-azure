from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime

class ContactBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: Optional[EmailStr] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20, pattern=r"^[+]?[0-9 -]+$")
    address: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = Field(None, max_length=4000)  # SQL Server text limit
    favorite: Optional[bool] = False

class ContactCreate(ContactBase):
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            # Rimuovi tutti i caratteri tranne numeri e + -
            cleaned = ''.join(c for c in v if c.isdigit() or c in '+-')
            if not cleaned:
                raise ValueError('Invalid phone number')
            # Limita la lunghezza per SQL Server
            if len(cleaned) > 20:
                raise ValueError('Phone number too long')
            return cleaned
        return v

    @field_validator('notes')
    @classmethod
    def validate_notes(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 4000:  # SQL Server text limit
            raise ValueError('Notes too long')
        return v

class ContactUpdate(ContactBase):
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = ''.join(c for c in v if c.isdigit() or c in '+-')
            if not cleaned:
                raise ValueError('Invalid phone number')
            if len(cleaned) > 20:
                raise ValueError('Phone number too long')
            return cleaned
        return v

class ContactResponse(ContactBase):
    id: int
    created_at: datetime
    updated_at: datetime
    full_name: str

    model_config = {
        "from_attributes": True
    }

class ContactSearch(BaseModel):
    query: str = Field(..., min_length=1, max_length=100)
    favorite_only: Optional[bool] = False

    model_config = {
        "json_schema_extra": {
            "example": {
                "query": "john",
                "favorite_only": False
            }
        }
    }

class ContactListResponse(BaseModel):
    items: List[ContactResponse]
    total: int
    page: int
    size: int
    pages: int

    model_config = {
        "json_schema_extra": {
            "example": {
                "items": [{
                    "id": 1,
                    "first_name": "John",
                    "last_name": "Doe",
                    "email": "john.doe@example.com",
                    "phone": "+1234567890",
                    "address": "123 Main St",
                    "notes": "Some notes",
                    "favorite": False,
                    "created_at": "2024-01-01T00:00:00",
                    "updated_at": "2024-01-01T00:00:00",
                    "full_name": "John Doe"
                }],
                "total": 1,
                "page": 1,
                "size": 10,
                "pages": 1
            }
        }
    }