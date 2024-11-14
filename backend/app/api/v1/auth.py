# app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Body,  Security
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from typing import Annotated
from jose import JWTError, jwt
from datetime import timedelta, datetime, timezone
import logging
from sqlalchemy import or_, func
from fastapi.security import HTTPAuthorizationCredentials
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    require_auth,
    security
)
from app.models.base import get_db
from app.models.models import User, Tenant
from app.schemas.auth import (
    UserCreate,
    UserLogin,
    LoginResponse,
    TenantCreate,
    PasswordReset,
    PasswordUpdate
)
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/debug-token")
async def debug_token(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    """
    Endpoint temporaneo per debug del token.
    RIMUOVERE IN PRODUZIONE
    """
    try:
        token = credentials.credentials
        logger.debug(f"Token ricevuto: {token[:20]}...")
        
        # Decodifica il token senza verificarlo
        unverified_payload = jwt.decode(
            token,
            key='',  # Chiave vuota per decodifica senza verifica
            options={"verify_signature": False}
        )
        
        # Controlla la scadenza
        exp = unverified_payload.get("exp")
        current_time = datetime.now(timezone.utc)
        exp_datetime = None
        time_to_expiry = None
        
        if exp:
            exp_datetime = datetime.fromtimestamp(exp, tz=timezone.utc)
            time_to_expiry = exp_datetime - current_time
        
        # Decodifica con verifica
        try:
            verified_payload = jwt.decode(
                token,
                key=settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )
            verification_status = "OK"
        except Exception as e:
            verification_status = f"FAILED: {str(e)}"
            
        # Log completo per debug
        logger.debug(f"""
        Debug Token Info:
        - Token Preview: {token[:20]}...
        - Environment: {settings.ENVIRONMENT}
        - Algorithm: {settings.ALGORITHM}
        - Secret Key Length: {len(settings.SECRET_KEY)}
        - Unverified Payload: {unverified_payload}
        - Verification Status: {verification_status}
        """)
            
        return {
            "token_preview": token[:20],
            "unverified_payload": unverified_payload,
            "verification_status": verification_status,
            "current_environment": settings.ENVIRONMENT,
            "algorithm": settings.ALGORITHM,
            "secret_key_length": len(settings.SECRET_KEY),
            "expiry_info": {
                "expiry_time": exp_datetime.isoformat() if exp_datetime else None,
                "current_time": current_time.isoformat(),
                "time_to_expiry": str(time_to_expiry) if time_to_expiry else None
            } if exp else None
        }
        
    except Exception as e:
        logger.error(f"Debug token error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )





@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def register(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate = Body(...)
) -> LoginResponse:
    try:
        logger.info(f"Starting user registration process for email: {user_in.email}")
        
        # Verifica esistenza utente
        logger.debug("Checking for existing user")
        existing_user = db.query(User).filter(
            or_(
                func.lower(User.email) == func.lower(user_in.email),
                func.lower(User.username) == func.lower(user_in.username)
            )
        ).first()
        
        if existing_user:
            logger.warning(f"Registration attempt with existing email/username: {user_in.email}")
            raise HTTPException(
                status_code=400,
                detail="Email o username già registrati"
            )

        # Crea il tenant se specificato
        logger.debug(f"Creating or retrieving tenant: {user_in.tenant_name}")
        tenant_name = user_in.tenant_name or "default"
        tenant = db.query(Tenant).filter(func.lower(Tenant.name) == func.lower(tenant_name)).first()
        if not tenant:
            logger.debug(f"Creating new tenant: {tenant_name}")
            current_time = datetime.now(timezone.utc)
            tenant = Tenant(
                name=tenant_name,
                active=True,
                created_at=current_time,
                updated_at=current_time
            )
            db.add(tenant)
            db.commit()
            db.refresh(tenant)

        # Crea il nuovo utente
        logger.debug(f"Creating new user with username: {user_in.username}")
        current_time = datetime.now(timezone.utc)
        db_user = User(
            email=user_in.email.lower(),
            username=user_in.username,
            hashed_password=get_password_hash(user_in.password),
            tenant_id=tenant.id,
            is_active=True,
            created_at=current_time,
            updated_at=current_time
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Crea il token
        logger.debug("Creating access token")
        access_token = create_access_token(
            data={"sub": str(db_user.id)},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        logger.info(f"User registration successful for: {user_in.email}")
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=db_user
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Errore durante la registrazione: {str(e)}" if settings.IS_DEVELOPMENT else "Errore durante la registrazione"
        )
    

@router.post("/login", response_model=LoginResponse)
async def login(
    user_in: UserLogin,
    db: Session = Depends(get_db),
) -> LoginResponse:
    """
    Autentica un utente e restituisce il token JWT.
    """
    try:
        # Cerca l'utente per username (case-insensitive)
        user = db.query(User).filter(
            func.lower(User.username) == func.lower(user_in.username)
        ).first()
        
        if not user or not verify_password(user_in.password, user.hashed_password):
            logger.warning(f"Failed login attempt for username: {user_in.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Username o password non corretti"
            )
        
        if not user.is_active:
            logger.warning(f"Login attempt for inactive user: {user_in.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Utente disattivato"
            )

        # Aggiorna last_login
        user.update_last_login()
        db.commit()

        # Crea il token di accesso
        access_token = create_access_token(
            data={"sub": user.id},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        logger.info(f"Successful login for user: {user_in.username}")
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Errore durante il login"
        )

@router.post("/password-reset", status_code=status.HTTP_202_ACCEPTED)
async def request_password_reset(
    *,
    db: Session = Depends(get_db),
    email_in: PasswordReset
) -> dict:
    """
    Inizia il processo di reset password.
    In produzione, invierebbe una email con il link di reset.
    """
    try:
        # Cerca utente (case-insensitive)
        user = db.query(User).filter(
            func.lower(User.email) == func.lower(email_in.email)
        ).first()
        
        logger.info(f"Password reset requested for email: {email_in.email}")
        
        if settings.IS_DEVELOPMENT:
            return {
                "message": "Se l'email è registrata, riceverai le istruzioni per il reset",
                "debug": bool(user)
            }
        return {
            "message": "Se l'email è registrata, riceverai le istruzioni per il reset"
        }
    except Exception as e:
        logger.error(f"Password reset error: {str(e)}")
        # Non esponiamo dettagli dell'errore all'utente per sicurezza
        return {
            "message": "Se l'email è registrata, riceverai le istruzioni per il reset"
        }

@router.put("/password", status_code=status.HTTP_200_OK)
async def change_password(
    *,
    db: Session = Depends(get_db),
    password_data: PasswordUpdate = Body(...),
    current_user_id: int = Depends(require_auth)
) -> dict:
    """
    Cambia la password dell'utente corrente.
    """
    try:
        logger.debug(f"Attempting password change for user_id: {current_user_id}")
        
        # Recupera l'utente dal database
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            logger.error(f"User not found for id: {current_user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utente non trovato"
            )

        # Verifica la password corrente
        if not verify_password(password_data.current_password, current_user.hashed_password):
            logger.warning(f"Invalid current password in change attempt for user: {current_user.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Password corrente non valida"
            )

        # Aggiorna la password
        try:
            current_user.hashed_password = get_password_hash(password_data.new_password)
            current_user.updated_at = datetime.now(timezone.utc)
            db.commit()
            logger.info(f"Password successfully changed for user: {current_user.username}")
            return {"message": "Password aggiornata con successo"}
        except Exception as db_error:
            logger.error(f"Database error during password update: {str(db_error)}")
            db.rollback()
            raise

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password change error: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e) if settings.IS_DEVELOPMENT else "Errore durante il cambio password"
        )

@router.get("/me", response_model=LoginResponse)
async def read_current_user(
    *,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(require_auth)  # Questo restituisce solo l'ID
) -> LoginResponse:
    """
    Restituisce i dati dell'utente corrente e rinnova il token.
    """
    try:
        # Recupera l'utente dal database usando l'ID
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utente non trovato"
            )

        # Crea un nuovo token
        access_token = create_access_token(
            data={"sub": current_user.id},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        logger.info(f"Current user data retrieved for: {current_user.username}")
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=current_user
        )
    except Exception as e:
        logger.error(f"Error retrieving current user data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Errore nel recupero dei dati utente"
        )