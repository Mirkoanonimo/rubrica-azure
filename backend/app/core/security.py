# In app/core/security.py

from datetime import datetime, timedelta, timezone
from typing import Optional, Union, Dict
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Security, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
from app.models.base import get_db
from sqlalchemy.orm import Session
import logging
import json

# Configurazione logging
logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security bearer token con debug
class DebugHTTPBearer(HTTPBearer):
    async def __call__(self, request: Request) -> HTTPAuthorizationCredentials:
        try:
            credentials = await super().__call__(request)
            logger.debug(f"Authorization header: {request.headers.get('Authorization')}")
            return credentials
        except Exception as e:
            logger.error(f"Authorization error: {str(e)}")
            raise

# Usa DebugHTTPBearer invece di HTTPBearer
security = DebugHTTPBearer(
    scheme_name="Bearer",
    description="Enter the Bearer token",
    auto_error=True
)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se la password in chiaro corrisponde all'hash"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"Password verification error: {str(e)}")
        return False

def get_password_hash(password: str) -> str:
    """Genera l'hash della password"""
    return pwd_context.hash(password)

def create_access_token(data: Dict[str, any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea un JWT token
    :param data: Dati da codificare nel token
    :param expires_delta: Tempo di scadenza opzionale
    :return: Token JWT codificato
    """
    try:
        to_encode = data.copy()
        
        # Converti l'ID utente in stringa
        if "sub" in to_encode:
            to_encode["sub"] = str(to_encode["sub"])
            
        now = datetime.now(timezone.utc)
        expire = now + (
            expires_delta 
            if expires_delta 
            else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        to_encode.update({
            "exp": expire,
            "iat": now,
            "env": settings.ENVIRONMENT
        })
        
        token = jwt.encode(
            to_encode,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )
        logger.debug(f"Created token: {token[:20]}... for user: {data.get('sub')}")
        return token
    except Exception as e:
        logger.error(f"Token creation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore nella creazione del token"
        )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Security(get_db)
) -> Optional[int]:
    """
    Verifica il token JWT e restituisce l'utente corrente
    """
    try:
        token = credentials.credentials
        logger.debug(f"Received token: {token}")
        
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )
            logger.debug(f"Successfully decoded token. Payload: {json.dumps(payload, indent=2)}")
        except Exception as decode_error:
            logger.error(f"Token decode error: {str(decode_error)}")
            raise

        # Token expiration check
        exp = payload.get("exp")
        if exp:
            exp_datetime = datetime.fromtimestamp(exp, tz=timezone.utc)
            current_time = datetime.now(timezone.utc)
            logger.debug(f"Token expiration: {exp_datetime}")
            logger.debug(f"Current time: {current_time}")
            logger.debug(f"Time until expiration: {exp_datetime - current_time}")
            
        # Environment check
        token_env = payload.get("env")
        current_env = settings.ENVIRONMENT
        logger.debug(f"Token environment: {token_env}")
        logger.debug(f"Current environment: {current_env}")

        if token_env != current_env:
            logger.error(f"Environment mismatch: Token env '{token_env}' != Current env '{current_env}'")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token environment mismatch: {token_env} != {current_env}",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        # Converti l'ID utente da stringa a intero
        try:
            user_id = int(user_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user ID format",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        logger.debug(f"User ID from token: {user_id}")
        
        return user_id

    except JWTError as e:
        logger.error(f"JWT decode error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token decode error: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e) if settings.IS_DEVELOPMENT else "Token non valido",
            headers={"WWW-Authenticate": "Bearer"},
        )

def require_auth(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> int:
    """
    Middleware per richiedere autenticazione
    """
    try:
        logger.debug(f"Checking auth token: {credentials.credentials[:20]}...")
        token = credentials.credentials
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("sub")
        if user_id is None:
            logger.error("Token missing user ID")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token non valido",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return int(user_id)
    except JWTError as e:
        logger.error(f"JWT decode error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token non valido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Auth error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Errore di autenticazione: {str(e)}" if settings.IS_DEVELOPMENT else "Errore di autenticazione",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Solo per test in development
def create_test_token(user_id: int) -> str:
    """
    Crea un token di test per un utente specifico
    ATTENZIONE: Usare solo in sviluppo/test
    """
    if not settings.IS_DEVELOPMENT:
        raise Exception("Questa funzione può essere usata solo in sviluppo")
        
    return create_access_token(
        data={"sub": user_id},
        expires_delta=timedelta(days=1)
    )