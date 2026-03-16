# DaVinci

Aplicación web para crear visualizaciones dinámicas de manera visual y rápida. Este repo contiene **backend (FastAPI)** y **frontend (React + Vite + Tailwind + ECharts)** en un solo monorepo.

## Estructura

```
.
├── backend/        # API FastAPI + Poetry
├── frontend/       # Cliente React + Vite
├── sample_data.csv # Dataset de prueba
└── README.md       # Este archivo
```

## Requisitos previos

- Python 3.10+
- [Poetry](https://python-poetry.org/docs/#installation)
- Node.js 18+

## Backend (FastAPI)

```bash
cd backend
poetry install
poetry run uvicorn app.main:app --reload --port 8000
```

Endpoints principales:
- `POST /api/upload` → Procesa archivos CSV/XLSX y devuelve metadatos + datos limpios
- `GET /api/health` → Health check
- Swagger UI en `http://localhost:8000/docs`

## Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Se abrirá en `http://localhost:5173`.

## Flujo básico

1. Ejecuta backend y frontend
2. Abre la app en el navegador
3. Sube un archivo CSV/XLSX (usa `sample_data.csv` para pruebas)
4. Selecciona un tipo de gráfico
5. Personaliza estilos, temas y exporta PNG

## Scripts útiles

| Ubicación  | Comando                                    | Descripción                       |
|------------|---------------------------------------------|-----------------------------------|
| `backend`  | `poetry run uvicorn app.main:app --reload`  | Inicia API FastAPI                |
| `frontend` | `npm run dev`                               | Inicia Vite en modo desarrollo    |
| `frontend` | `npm run build`                             | Compila la SPA                   |

## Notas

- El backend expone solo endpoints de API; la UI vive en el frontend.
- Tailwind + shadcn/ui están configurados para un diseño oscuro moderno.
- Para nuevos datasets, simplemente súbelos desde el panel izquierdo.
