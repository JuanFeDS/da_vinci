"""Funciones para limpiar y enriquecer los datos antes de enviarlos al frontend."""
import pandas as pd
import numpy as np

from app.models.schemas import ProcessedData, DatasetInfo, ColumnInfo


MAX_PREVIEW_ROWS = 100
MAX_SAMPLE_VALUES = 5


def _infer_column_type(series: pd.Series) -> str:
    """Determina si una columna es numérica, categórica o de fecha."""
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    return "categorical"


def _get_sample_values(series: pd.Series) -> list:
    """Devuelve una muestra corta de valores no nulos para mostrar en la UI."""
    return series.dropna().unique()[:MAX_SAMPLE_VALUES].tolist()


def _clean_value(value):
    """Normaliza valores numéricos y reemplaza NaN/inf por None."""
    if isinstance(value, float) and (np.isnan(value) or np.isinf(value)):
        return None
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return float(value)
    return value


def _clean_row(row: dict) -> dict:
    """Aplica _clean_value a cada valor de un registro."""
    return {key: _clean_value(value) for key, value in row.items()}


def process_dataframe(df: pd.DataFrame, filename: str) -> ProcessedData:
    """Construye la estructura ProcessedData a partir de un DataFrame crudo."""
    numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    categorical_cols = [c for c in df.columns if not pd.api.types.is_numeric_dtype(df[c])]

    columns_info = [
        ColumnInfo(
            name=column,
            type=_infer_column_type(df[column]),
            sample_values=_get_sample_values(df[column])
        )
        for column in df.columns
    ]

    preview_rows = df.head(10).to_dict(orient="records")
    preview_clean = [_clean_row(row) for row in preview_rows]

    all_rows = df.head(MAX_PREVIEW_ROWS).to_dict(orient="records")
    data_clean = [_clean_row(row) for row in all_rows]

    dataset_info = DatasetInfo(
        filename=filename,
        rows=len(df),
        columns=columns_info,
        preview=preview_clean
    )

    return ProcessedData(
        columns=list(df.columns),
        numeric_columns=numeric_cols,
        categorical_columns=categorical_cols,
        data=data_clean,
        dataset_info=dataset_info
    )
