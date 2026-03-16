"""Definición de rutas públicas para la API de DaVinci."""
from fastapi import APIRouter, UploadFile, File

from app.utils.file_handler import validate_file, read_dataframe
from app.api.data_processor import process_dataframe

router = APIRouter(prefix="/api", tags=["data"])


@router.post("/upload", summary="Subir archivo CSV o Excel")
async def upload_file(file: UploadFile = File(...)):
    """Recibe un archivo, valida su formato y devuelve los datos procesados."""
    validate_file(file.filename or "", None)
    df = await read_dataframe(file)
    result = process_dataframe(df, file.filename or "dataset")
    return result


@router.get("/health", summary="Health check")
async def health_check():
    """Devuelve el estado básico del servicio para monitoreo."""
    response = {
        "status": "ok", 
        "app": "DaVinci API"
    }
    
    return response
