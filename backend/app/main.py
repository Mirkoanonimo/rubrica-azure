import time
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.api.v1 import auth, contacts



# Configurazione logging
logging.basicConfig(
    level=logging.DEBUG if settings.IS_DEVELOPMENT else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


# Creazione app FastAPI con metadati migliorati
app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="API Backend per la Rubrica Contatti",
    docs_url="/api/docs" if settings.ENVIRONMENT == "development" else None,  # Disabilita docs in prod
    redoc_url="/api/redoc" if settings.ENVIRONMENT == "development" else None
)

# Configurazione CORS sicura
origins = ["http://localhost:5173", "http://localhost:3000"] if settings.ENVIRONMENT == "development" else [settings.FRONTEND_URL]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware per logging e performance monitoring ottimizzato per F1
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
        # Aggiungi il tempo di processo all'header solo in development
        if settings.ENVIRONMENT == "development":
            process_time = time.time() - start_time
            response.headers["X-Process-Time"] = str(process_time)
        return response
    except Exception as e:
        # Log dell'errore (limitato in produzione)
        process_time = time.time() - start_time
        error_detail = str(e) if settings.ENVIRONMENT == "development" else "Internal Server Error"
        return JSONResponse(
            status_code=500,
            content={
                "detail": error_detail,
                "process_time": process_time if settings.ENVIRONMENT == "development" else None
            }
        )

# Gestione errori database con messaggi sicuri
@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    error_message = str(exc) if settings.ENVIRONMENT == "development" else "Database error"
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Database error",
            "message": error_message
        }
    )

# Root endpoint - informazioni limitate in produzione
@app.get("/")
def read_root():
    return {
        "app": settings.APP_NAME,
        "status": "running",
        "version": "1.0.0" if settings.ENVIRONMENT == "development" else None
    }

# Health check endpoint ottimizzato
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": int(time.time())  # Usiamo int invece di float per ridurre i dati
    }

# Test database connection - solo in development
@app.get("/db-test", include_in_schema=False)
async def test_db():
    if settings.ENVIRONMENT != "development":
        return JSONResponse(status_code=404)
    
    from app.models.base import get_db
    from sqlalchemy import text
    
    try:
        db = next(get_db())
        result = db.execute(text("SELECT 1"))
        return {
            "status": "database connected",
            "type": "local" if settings.DATABASE_HOST == "localhost" else "azure"
        }
    except Exception as e:
        return {
            "status": "database error",
            "detail": str(e) if settings.ENVIRONMENT == "development" else "Connection failed"
        }

# Inclusione dei router con prefisso versione
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(contacts.router, prefix=f"{settings.API_V1_STR}/contacts", tags=["contacts"])

# Entry point per development server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
        workers=1  # Limitiamo i workers per il piano F1
    )