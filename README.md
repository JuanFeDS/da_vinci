# DaVinci

Aplicación de visualización de datos dinámica disponible como **app web** y **app de escritorio** (Tauri). Este repo contiene backend (FastAPI) y frontend (React + Vite + Tailwind + ECharts) en un solo monorepo.

## Estructura

```
.
├── backend/              # API FastAPI + Poetry
├── frontend/
│   ├── src/              # Código fuente React (compartido web + desktop)
│   ├── src-tauri/        # Configuración y código nativo Tauri
│   ├── .env.example      # Plantilla de variables de entorno
│   └── ...
├── sample_data.csv       # Dataset de prueba
└── README.md
```

## Requisitos previos

- Python 3.10+ y [Poetry](https://python-poetry.org/docs/#installation)
- Node.js 18+
- **Solo para app desktop:** [Rust](https://rustup.rs/) (se instala con `winget install Rustlang.Rustup`)

## Backend (FastAPI)

```bash
cd backend
poetry install
poetry run uvicorn app.main:app --reload --port 8000
```

Endpoints principales:
- `POST /api/upload` → Procesa CSV/XLSX y devuelve metadatos + datos limpios
- `GET /api/health` → Health check
- Swagger UI en `http://localhost:8000/docs`

## Frontend Web

```bash
cd frontend
cp .env.example .env   # Configurar URL del backend
npm install
npm run dev            # http://localhost:5173
```

## App de Escritorio (Tauri)

```bash
cd frontend
cp .env.example .env   # Configurar URL del backend
npm install
npm run tauri:dev      # Abre ventana nativa con hot reload
```

### Build del instalador

```bash
cd frontend
npm run tauri:build
# Instaladores generados en: src-tauri/target/release/bundle/
#   Windows: bundle/msi/DaVinci_1.0.0_x64_es-MX.msi
#            bundle/nsis/DaVinci_1.0.0_x64-setup.exe
```

El instalador resultante (~5 MB) puede distribuirse a otros equipos.

## Variables de entorno

Copia `.env.example` como `.env` y ajusta la URL del backend:

```env
# Desarrollo local
VITE_API_URL=http://localhost:8000

# Producción
VITE_API_URL=https://tu-backend.com
```

## Scripts útiles

| Ubicación  | Comando                                     | Descripción                        |
|------------|---------------------------------------------|------------------------------------|
| `backend`  | `poetry run uvicorn app.main:app --reload`  | Inicia API FastAPI                 |
| `frontend` | `npm run dev`                               | Inicia versión web (localhost:5173)|
| `frontend` | `npm run build`                             | Compila SPA para deploy web        |
| `frontend` | `npm run tauri:dev`                         | App desktop con hot reload         |
| `frontend` | `npm run tauri:build`                       | Genera instaladores de escritorio  |

## Flujo básico

1. Ejecuta backend y frontend (web o desktop)
2. Sube un archivo CSV/XLSX (usa `sample_data.csv` para pruebas)
3. Selecciona un tipo de gráfico
4. Personaliza estilos, temas y usa el inspector de elementos
5. Exporta como PNG o JSON

## Notas

- El mismo código React sirve tanto para web como para desktop.
- La app desktop requiere conexión a internet para comunicarse con el backend.
- Tauri usa WebView2 (ya incluido en Windows 11 / se instala automáticamente en Windows 10).
