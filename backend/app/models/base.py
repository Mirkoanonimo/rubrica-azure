from typing import Generator, Any
from sqlalchemy.ext.declarative import as_declarative, declared_attr
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, MetaData, event
from sqlalchemy.exc import SQLAlchemyError
from app.core.config import settings
import logging
import pyodbc
from contextlib import contextmanager
import time

# Configurazione logging
logger = logging.getLogger(__name__)

# Naming convention per i vincoli del database
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

metadata = MetaData(naming_convention=convention)

def get_engine():
    """
    Crea e configura l'engine SQLAlchemy in base all'ambiente
    """
    if settings.IS_DEVELOPMENT:
        # Configurazione PostgreSQL per development
        engine_args = {
            "pool_pre_ping": True,
            "pool_size": settings.DB_POOL_SIZE,
            "max_overflow": settings.DB_MAX_OVERFLOW,
            "pool_recycle": 1800,
            "pool_timeout": 30
        }
    else:
        # Configurazione Azure SQL per production
        engine_args = {
            "pool_pre_ping": True,
            "pool_size": settings.DB_POOL_SIZE,
            "max_overflow": settings.DB_MAX_OVERFLOW,
            "pool_recycle": 1800,
            "pool_timeout": 30,
            "connect_args": {
                "timeout": 30,
                "driver": "ODBC Driver 18 for SQL Server",
                "TrustServerCertificate": "yes",
                "encrypt": "yes",
                "connection_timeout": 30
            }
        }
    
    engine = create_engine(settings.DATABASE_URL, **engine_args)
    
    if not settings.IS_DEVELOPMENT:
        # Eventi per ottimizzare Azure SQL Free Tier
        @event.listens_for(engine, 'before_cursor_execute')
        def receive_before_cursor_execute(conn, cursor, statement, params, context, executemany):
            if not executemany:
                cursor.fast_executemany = True
                cursor.arraysize = 1000

        @event.listens_for(engine, 'connect')
        def receive_connect(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("SET QUERY_GOVERNOR_COST_LIMIT 5000")  # Limita query costose
            cursor.execute("SET LOCK_TIMEOUT 5000")  # 5 secondi timeout
            cursor.close()
    
    return engine

# Creazione engine
engine = get_engine()

# Session factory ottimizzata
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)

@as_declarative(metadata=metadata)
class Base:
    """
    Classe base per tutti i modelli SQLAlchemy.
    Fornisce funzionalità comuni e convenzioni di naming.
    """
    id: Any
    __name__: str
    
    @declared_attr
    def __tablename__(cls) -> str:
        return cls.__name__.lower()

    def to_dict(self) -> dict:
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Base":
        return cls(**data)

@contextmanager
def get_db_connection():
    """Context manager per gestire le connessioni al database"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def execute_with_retry(db_session, query_func, max_attempts=3):
    """Esegue query con retry in caso di errori temporanei"""
    attempt = 0
    last_error = None

    while attempt < max_attempts:
        try:
            return query_func(db_session)
        except SQLAlchemyError as e:
            last_error = e
            error_msg = str(e).lower()
            
            # Verifica se l'errore è recuperabile
            if any(err in error_msg for err in ["timeout", "deadlock", "connection reset"]):
                attempt += 1
                if attempt < max_attempts:
                    sleep_time = 2 ** attempt  # Backoff esponenziale
                    logger.warning(f"Tentativo {attempt}/{max_attempts} fallito. Nuovo tentativo tra {sleep_time} secondi")
                    time.sleep(sleep_time)
                    continue
            else:
                # Errore non recuperabile
                break

    logger.error(f"Query fallita dopo {max_attempts} tentativi: {str(last_error)}")
    raise last_error

def get_db() -> Generator:
    """Generator function per ottenere una sessione del database."""
    with get_db_connection() as db:
        try:
            if settings.IS_DEVELOPMENT:
                logger.debug("Database connection established")
            yield db
        except SQLAlchemyError as e:
            logger.error(f"Database connection error: {str(e)}")
            raise

def init_db() -> None:
    """Inizializza il database creando tutte le tabelle."""
    try:
        if settings.IS_DEVELOPMENT:
            Base.metadata.create_all(bind=engine)
            logger.info("Database initialized successfully")
    except SQLAlchemyError as e:
        logger.error(f"Database initialization error: {str(e)}")
        raise

def cleanup_db() -> None:
    """Pulisce le risorse del database."""
    try:
        engine.dispose()
        if settings.IS_DEVELOPMENT:
            logger.info("Database connections disposed")
    except SQLAlchemyError as e:
        logger.error(f"Database cleanup error: {str(e)}")
        raise

def get_db_metrics() -> dict:
    """
    Restituisce metriche del database per monitoring
    """
    try:
        with engine.connect() as conn:
            if settings.IS_DEVELOPMENT:
                result = conn.execute("SELECT version();").scalar()
                version = str(result)
            else:
                result = conn.execute("SELECT @@VERSION;").scalar()
                version = str(result)

        return {
            "database_type": "postgresql" if settings.IS_DEVELOPMENT else "azure_sql",
            "version": version,
            "pool_size": settings.DB_POOL_SIZE,
            "max_overflow": settings.DB_MAX_OVERFLOW,
            "pool_timeout": settings.SQL_CONNECTION_TIMEOUT,
            "environment": settings.ENVIRONMENT
        }
    except SQLAlchemyError as e:
        logger.error(f"Error getting database metrics: {str(e)}")
        raise

def chunks(lst, n):
    """Utility per dividere liste in chunks per batch operations"""
    for i in range(0, len(lst), n):
        yield lst[i:i + n]