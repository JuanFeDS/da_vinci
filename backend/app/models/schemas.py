"""Esquemas Pydantic que definen la interfaz del backend."""

from typing import Any
from pydantic import BaseModel


class ColumnInfo(BaseModel):
    """Describe el nombre, tipo y ejemplos de una columna."""
    name: str
    type: str
    sample_values: list[Any]


class DatasetInfo(BaseModel):
    """Metadatos del dataset cargado (nombre, filas, preview)."""
    filename: str
    rows: int
    columns: list[ColumnInfo]
    preview: list[dict[str, Any]]


class ProcessedData(BaseModel):
    """Respuesta principal que usa el frontend para configurar gráficos."""
    columns: list[str]
    numeric_columns: list[str]
    categorical_columns: list[str]
    data: list[dict[str, Any]]
    dataset_info: DatasetInfo


class ErrorResponse(BaseModel):
    """Modelo simple para devolver mensajes de error controlados."""
    detail: str
