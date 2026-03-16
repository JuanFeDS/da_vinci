# DaVinci Backend

API REST construida con FastAPI para procesar archivos CSV/Excel y servir datos a la aplicación de visualización.

## Instalación con Poetry

```bash
# Instalar dependencias
poetry install

# Activar el entorno virtual
poetry shell
```

## Ejecutar el servidor

```bash
# Con Poetry
poetry run uvicorn app.main:app --reload --port 8000

# O si ya estás en el shell de Poetry
uvicorn app.main:app --reload --port 8000
```

El servidor estará disponible en `http://localhost:8000`

## Endpoints

- `POST /api/upload` - Subir archivo CSV o Excel
- `GET /api/health` - Health check

## Documentación API

Una vez corriendo el servidor, visita:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
