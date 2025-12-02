import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from api.artifact_routes import router as artifact_router, get_artifacts_count
from api.persona_routes import router as persona_router, get_personas_count

load_dotenv()

app = FastAPI(
    title="Museum AI Guide API",
    description="AI-powered museum guide with RAG-based Q&A system",
    version="1.0.0"
)

# Add CORS middleware for Flutter app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your Flutter app's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(artifact_router)
app.include_router(persona_router)


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Museum AI Guide API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "artifact_info": "/artifact/{artifact_id}",
            "ask_artifact": "/artifact/ask",
            "personas": "/personas",
            "persona_info": "/persona/{king_id}",
            "ask_persona": "/persona/ask"
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "artifacts_loaded": get_artifacts_count(),
        "personas_loaded": get_personas_count(),
        "data_path": "data/artifacts.csv",
        "personas_path": "data/Ancient_Kings.csv"
    }
