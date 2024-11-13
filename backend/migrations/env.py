from logging.config import fileConfig
from sqlalchemy import engine_from_config, create_engine
from sqlalchemy import pool
from alembic import context
import os
import sys
import logging

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from app.core.config import settings
from app.models.base import Base

# Logger configurazione
logger = logging.getLogger("alembic.env")

# Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# MetaData per l'autogenerazione
target_metadata = Base.metadata

def get_url():
    """
    Costruisce l'URL del database basato sull'ambiente.
    Supporta sia PostgreSQL (dev) che Azure SQL (prod)
    """
    if settings.IS_DEVELOPMENT:
        return (
            f"postgresql://{settings.DATABASE_USERNAME}:"
            f"{settings.DATABASE_PASSWORD}@{settings.DATABASE_HOST}:"
            f"{settings.DATABASE_PORT}/{settings.DATABASE_NAME}"
        )
    else:
        # Azure SQL connection string
        server = f"{settings.SQL_SERVER_NAME}.database.windows.net"
        return (
            f"mssql+pyodbc://{settings.DATABASE_USERNAME}:"
            f"{settings.DATABASE_PASSWORD}@{server}/"
            f"{settings.DATABASE_NAME}?"
            "driver=ODBC+Driver+18+for+SQL+Server"
            "&TrustServerCertificate=yes&encrypt=yes"
        )

def run_migrations_offline() -> None:
    """
    Esegue le migrazioni in modalità 'offline'.
    Utile per generare script SQL.
    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,                # Confronta i tipi di colonna
        compare_server_default=True,      # Confronta i valori default
        include_schemas=True              # Include gli schema
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """
    Esegue le migrazioni in modalità 'online'.
    """
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = get_url()

    engine = create_engine(
        configuration["sqlalchemy.url"],
        poolclass=pool.NullPool
    )

    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
            include_schemas=True,
            version_table_schema=target_metadata.schema
        )

        try:
            with context.begin_transaction():
                logger.info(f"Running migrations in {settings.ENVIRONMENT} environment")
                context.run_migrations()
        except Exception as e:
            logger.error(f"Error during migration: {e}")
            raise

def run_migrations():
    """Funzione principale per l'esecuzione delle migrazioni"""
    try:
        if context.is_offline_mode():
            logger.info("Running migrations offline")
            run_migrations_offline()
        else:
            logger.info("Running migrations online")
            run_migrations_online()
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()