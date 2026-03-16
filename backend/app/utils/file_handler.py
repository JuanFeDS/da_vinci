"""Utilidades para validar y convertir archivos subidos a DataFrames."""
import io

import pandas as pd
from fastapi import UploadFile, HTTPException


ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}
MAX_FILE_SIZE_MB = 50


def validate_file(filename: str, content_length: int | None) -> None:
    """Valida extensión y tamaño del archivo antes de procesarlo."""
    ext = "." + filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Formato no soportado. Use: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    if content_length and content_length > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"Archivo demasiado grande. Máximo {MAX_FILE_SIZE_MB}MB"
        )


async def read_dataframe(file: UploadFile) -> pd.DataFrame:
    """Lee un UploadFile y regresa un DataFrame limpio listo para análisis."""
    contents = await file.read()
    filename = file.filename or ""
    ext = "." + filename.rsplit(".", 1)[-1].lower()

    try:
        if ext == ".csv":
            df = pd.read_csv(io.BytesIO(contents), encoding="utf-8-sig")
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Error leyendo archivo: {str(e)}"
        ) from e

    if df.empty:
        raise HTTPException(status_code=422, detail="El archivo está vacío")

    df = df.dropna(how="all")
    df.columns = [str(column).strip() for column in df.columns]
    return df
