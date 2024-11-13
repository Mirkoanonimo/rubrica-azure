import os
import sys
from pathlib import Path
import logging
import uuid
from datetime import datetime, timezone
from typing import Generator, Dict
from dotenv import load_dotenv
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Configura i percorsi base
ROOT_DIR = Path(__file__).parent.parent.parent  # rubrica-azure
BACKEND_DIR = ROOT_DIR / "backend"  # rubrica-azure/backend
BACKEND_TESTS_DIR = ROOT_DIR / "tests" / "backend_tests"  # rubrica-azure/tests/backend_tests
ENV_FILE = BACKEND_DIR / ".env"
load_dotenv(dotenv_path=ENV_FILE)

# Aggiungi backend al PYTHONPATH
sys.path.insert(0, str(BACKEND_DIR))

from backend.app.main import app
from backend.app.models.base import Base, get_db
from backend.app.models.models import User, Tenant
from backend.app.core.security import create_access_token, get_password_hash

def setup_test_logging() -> logging.Logger:
    """Configura il logging per i test"""
    # Log file nella directory backend_tests
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = BACKEND_TESTS_DIR / f"test_results.log"
    
    # Configura il formato del logging
    log_format = '%(asctime)s [%(levelname)s] %(message)s - %(filename)s:%(lineno)d'
    
    logging.basicConfig(
        level=logging.DEBUG,
        format=log_format,
        handlers=[
            logging.FileHandler(log_file, mode='w', encoding='utf-8'),
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    logger = logging.getLogger('api_tests')
    logger.info(f"Test logging initialized. Log file: {log_file}")
    return logger

# Configura il logger
logger = setup_test_logging()

# Database in-memory per i test
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="session")
def db_engine():
    """Crea un engine di database per i test"""
    logger.info("Creating test database engine")
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    @event.listens_for(engine, "connect")
    def do_connect(dbapi_connection, connection_record):
        # Abilita il foreign key support per SQLite
        dbapi_connection.execute("PRAGMA foreign_keys=ON")
    
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Test database tables created successfully")
        yield engine
    finally:
        logger.info("Cleaning up test database")
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db(db_engine) -> Generator:
    """Fornisce una sessione di database pulita per ogni test"""
    TestingSessionLocal = sessionmaker(bind=db_engine)
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    try:
        logger.info("Created new test database session")
        yield session
    finally:
        logger.info("Rolling back transaction and closing test database session")
        session.close()
        transaction.rollback()
        connection.close()

@pytest.fixture(scope="function")
def clean_db(db):
    """Pulisce il database prima di ogni test"""
    logger.info("Cleaning database before test")
    for table in reversed(Base.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()
    return db

@pytest.fixture(scope="function")
def test_tenant(clean_db) -> Tenant:
    """Crea un tenant di test con nome univoco"""
    logger.info("Creating test tenant")
    tenant_name = f"test_tenant_{uuid.uuid4().hex[:8]}"
    tenant = Tenant(
        name=tenant_name,
        active=True,
        created_at=datetime.now(timezone.utc)
    )
    clean_db.add(tenant)
    clean_db.commit()
    clean_db.refresh(tenant)
    logger.info(f"Created test tenant: {tenant_name}")
    return tenant

@pytest.fixture(scope="function")
def test_user(clean_db, test_tenant) -> Dict[str, any]:
    """Crea un utente di test con password nota"""
    logger.info("Creating test user")
    password = "Test123!"
    hashed_password = get_password_hash(password)
    
    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password=hashed_password,
        tenant_id=test_tenant.id,
        is_active=True,
        created_at=datetime.now(timezone.utc)
    )
    clean_db.add(user)
    clean_db.commit()
    clean_db.refresh(user)
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    logger.info(f"Created test user: {user.username}")
    return {
        "user": user,
        "token": access_token,
        "password": password
    }

@pytest.fixture(scope="function")
def client(clean_db) -> Generator:
    """Crea un client di test per le chiamate API"""
    def override_get_db():
        try:
            yield clean_db
        finally:
            pass
    
    logger.info("Setting up test client")
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client