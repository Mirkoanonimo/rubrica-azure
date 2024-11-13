from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime

class TenantBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, pattern="^[a-zA-Z0-9_-]+$")

class TenantCreate(TenantBase):
    pass

class TenantResponse(TenantBase):
    id: int
    created_at: datetime
    active: bool

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: EmailStr = Field(..., max_length=255)
    username: str = Field(..., min_length=3, max_length=50, pattern="^[a-zA-Z0-9_-]+$")

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=50)
    tenant_name: Optional[str] = Field(None, min_length=2, max_length=100)

    @validator('password')
    def password_strength(cls, v):
        """Requisiti SQL Server per password"""
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        if not any(c in '!@#$%^&*()' for c in v):
            raise ValueError('Password must contain at least one special character (!@#$%^&*())')
        return v

    @validator('username')
    def validate_username(cls, v):
        """Validazione username per SQL Server"""
        reserved_words = ['admin', 'administrator', 'sa', 'root']
        if v.lower() in reserved_words:
            raise ValueError('Username non valido')
        return v

class UserLogin(BaseModel):
    username: str = Field(..., max_length=50)
    password: str = Field(..., max_length=50)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = Field(None, max_length=255)
    password: Optional[str] = Field(None, min_length=8, max_length=50)

    @validator('password')
    def password_strength(cls, v):
        if v is not None:
            if not any(c.isupper() for c in v):
                raise ValueError('Password must contain at least one uppercase letter')
            if not any(c.islower() for c in v):
                raise ValueError('Password must contain at least one lowercase letter')
            if not any(c.isdigit() for c in v):
                raise ValueError('Password must contain at least one number')
            if not any(c in '!@#$%^&*()' for c in v):
                raise ValueError('Password must contain at least one special character')
        return v

class UserResponse(UserBase):
    id: int
    tenant_id: int
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: UserResponse

class PasswordReset(BaseModel):
    """Schema per la richiesta di reset password"""
    email: EmailStr = Field(..., description="Email dell'utente")

class PasswordUpdate(BaseModel):
    """Schema per l'aggiornamento della password"""
    current_password: str = Field(..., min_length=8, max_length=50)
    new_password: str = Field(..., min_length=8, max_length=50)

    @validator('new_password')
    def password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        if not any(c in '!@#$%^&*()' for c in v):
            raise ValueError('Password must contain at least one special character (!@#$%^&*())')
        return v

class PasswordResetConfirm(BaseModel):
    """Schema per la conferma del reset password"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=50)

    @validator('new_password')
    def password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        if not any(c in '!@#$%^&*()' for c in v):
            raise ValueError('Password must contain at least one special character (!@#$%^&*())')
        return v