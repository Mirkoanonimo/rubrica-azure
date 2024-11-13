# app/core/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional

class Settings(BaseSettings):
    # App Configuration
    APP_NAME: str = "Rubrica"
    ENVIRONMENT: str = "development"  # development o production
    API_V1_STR: str = "/api/v1"

    # Frontend URL (per CORS in production)
    FRONTEND_URL: str = "http://localhost:3000"  # Modificare in produzione

    # Authentication
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Database Configuration
    DATABASE_TYPE: str = "azure_sql"  # "postgresql" in dev, "azure_sql" in prod
    DATABASE_NAME: str
    DATABASE_USERNAME: str
    DATABASE_PASSWORD: str
    DATABASE_HOST: str = "localhost"  # Per development
    DATABASE_PORT: str = "5432"  # Per PostgreSQL in development

    # Azure SQL Server Settings
    SQL_SERVER_NAME: Optional[str] = None
    SQL_SERVER_HOSTNAME: Optional[str] = None

    # Rate Limiting - Ottimizzato per F1
    RATE_LIMIT_PER_MINUTE: int = 20

    # Performance - Ottimizzato per F1
    ITEMS_PER_PAGE: int = 10
    MAX_PAGE_SIZE: int = 50
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10

    # Azure Settings
    AZURE_APP_SERVICE_NAME: Optional[str] = None
    AZURE_REGION: Optional[str] = None

    # Monitoring
    ALERT_EMAIL: Optional[str] = None

    @property
    def DATABASE_URL(self) -> str:
        """
        Costruisce la stringa di connessione al database.
        In development usa PostgreSQL locale, in production usa Azure SQL.
        """
        if self.ENVIRONMENT == "development":
            return f"postgresql://{self.DATABASE_USERNAME}:{self.DATABASE_PASSWORD}@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"
        else:
            # Azure SQL connection string
            server = f"{self.SQL_SERVER_NAME}.database.windows.net"
            return (
                f"mssql+pyodbc://{self.DATABASE_USERNAME}:{self.DATABASE_PASSWORD}@{server}"
                f"/{self.DATABASE_NAME}?driver=ODBC+Driver+18+for+SQL+Server"
                f"&TrustServerCertificate=yes&encrypt=yes"
            )

    @property
    def IS_DEVELOPMENT(self) -> bool:
        """Verifica se l'ambiente è development"""
        return self.ENVIRONMENT == "development"

    @property
    def IS_PRODUCTION(self) -> bool:
        """Verifica se l'ambiente è production"""
        return self.ENVIRONMENT == "production"

    @property
    def SQL_CONNECTION_TIMEOUT(self) -> int:
        """Timeout di connessione ottimizzato per F1"""
        return 30 if self.IS_PRODUCTION else 10

    class Config:
        env_file = ".env"
        case_sensitive = True

        @classmethod
        def validate_all(cls, v):
            values = super().validate_all(v)
            
            if values.get("ENVIRONMENT") == "production":
                # Validazioni per ambiente production
                assert values.get("SECRET_KEY") != "chiavesegretapertest123", \
                    "Non usare la chiave di test in produzione"
                assert values.get("AZURE_APP_SERVICE_NAME"), \
                    "AZURE_APP_SERVICE_NAME richiesto in produzione"
                assert values.get("SQL_SERVER_NAME"), \
                    "SQL_SERVER_NAME richiesto in produzione"
                assert values.get("ALERT_EMAIL"), \
                    "ALERT_EMAIL richiesto in produzione"
                
                # Validazioni database
                assert len(values.get("DATABASE_PASSWORD", "")) >= 8, \
                    "La password del database deve essere di almeno 8 caratteri"
                assert values.get("DATABASE_USERNAME") != "admin", \
                    "Username 'admin' non consentito per Azure SQL"

            return values

@lru_cache()
def get_settings() -> Settings:
    """
    Crea un'istanza singleton delle impostazioni.
    L'uso di lru_cache mantiene una singola istanza per efficienza.
    """
    return Settings()

# Istanza delle impostazioni da usare nell'applicazione
settings = get_settings()