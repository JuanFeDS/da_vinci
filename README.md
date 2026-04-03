# 🎨 DaVinci

Aplicación interactiva de visualización de datos que permite explorar datasets CSV/XLSX a través de más de 12 tipos de gráficos configurables, con personalización por temas, colores y elementos individuales. Disponible como **app web** y **app de escritorio nativa** (Tauri).

## ✨ Qué hace

El flujo principal es simple:

1. 📂 **Sube un archivo** CSV o XLSX (hasta 50 MB)
2. 🔍 El backend infiere automáticamente los tipos de columna (numérico, categórico, datetime)
3. 📊 **Elige un tipo de gráfico** — el sistema asigna ejes automáticamente según los tipos de dato
4. 🎨 **Personaliza** apariencia, colores y elementos individuales
5. 💾 **Exporta** como PNG o JSON

## 📊 Tipos de gráficos

| Categoría | Gráficos disponibles |
|-----------|----------------------|
| 📊 Comparación | Bar, Grouped Bar, Stacked Bar |
| 📈 Tendencia | Line, Area |
| 📉 Distribución | Histogram |
| 🔵 Correlación | Scatter, Bubble, Heatmap |
| 🥧 Proporción | Pie, Donut, Treemap |

## ⚡ Funcionalidades principales

- 📂 **Carga de datos**: Drag-and-drop de CSV/XLSX; detección automática de tipos de columna
- 🎨 **Temas visuales**: 6 paletas predefinidas — Cosmic, Aurora, Ember, Forest, Neon, Pastel
- 🖌️ **Modos de color**: Uniforme (color del tema), Por categoría (mapeo automático), Personalizado (color por valor)
- 🔎 **Inspector de elementos**: Click en cualquier elemento del gráfico para sobrescribir su color, opacidad, borde o etiqueta
- ⚙️ **Panel de configuración dinámico**: Controles de título, ejes, leyenda, grilla, radio, gradientes, etc. — específicos por tipo de gráfico
- 💾 **Exportación**: PNG en alta resolución o JSON con la configuración completa

## 🏗️ Arquitectura

```
da_vinci/
├── backend/          # 🐍 API FastAPI (Python)
│   └── app/
│       ├── main.py               # App setup, CORS, rutas
│       ├── api/
│       │   ├── routes.py         # POST /api/upload, GET /api/health
│       │   └── data_processor.py # Inferencia de tipos, generación de preview
│       ├── models/
│       │   └── schemas.py        # Modelos Pydantic (ColumnInfo, DatasetInfo)
│       └── utils/
│           └── file_handler.py   # Validación y parseo CSV/XLSX
│
└── frontend/         # ⚛️ React + Vite + TypeScript
    └── src/
        ├── App.tsx               # Layout 3 paneles: sidebar | viewer | config
        ├── charts/               # Plugin de gráficos (12 tipos + registry)
        │   ├── registry.ts       # Registro y descubrimiento de charts
        │   └── *.ts              # Implementaciones individuales (ECharts config builders)
        ├── components/
        │   ├── DataUploader      # Drag-drop con react-dropzone
        │   ├── ChartViewer       # Renderizado ECharts + botones de exportación
        │   ├── ChartSelector     # Grilla de selección de tipo de gráfico
        │   ├── ConfigPanel       # Formulario dinámico de configuración
        │   ├── InspectorPanel    # Override de elementos individuales
        │   ├── ThemeManager      # Selector de temas
        │   └── ColorEditor       # Mapeo de colores por valor
        ├── hooks/
        │   ├── useChartConfig    # Estado del gráfico y su configuración
        │   ├── useTheme          # Tema activo y switching
        │   ├── useInspector      # Selección de elementos y overrides
        │   └── useColorByField   # Coloreado por categoría
        ├── types/
        │   ├── chart.types.ts    # ChartPlugin, ChartConfig, ColorMode
        │   ├── data.types.ts     # ProcessedData, DataRow, ColumnInfo
        │   └── theme.types.ts    # Theme interface + 6 presets
        └── utils/
            ├── chartExport       # Export PNG vía canvas
            ├── configExport      # Serialización JSON
            └── colorResolver     # Resolución tema + overrides de color
```

### 🔄 Cómo se conectan las partes

```
👤 Usuario sube archivo
       ↓
🐍 Backend (FastAPI) procesa y devuelve:
  - Lista de columnas con tipos inferidos
  - Preview de los datos (primeras N filas)
       ↓
⚛️ Frontend recibe los datos en useChartConfig
  → ChartSelector muestra los 12 tipos disponibles
  → Al elegir un chart, registry.ts asigna ejes automáticamente
  → ConfigPanel renderiza controles dinámicos según el chart elegido
  → ChartViewer pasa la config al chart plugin correspondiente
  → El plugin genera un ECharts option object
  → ECharts renderiza el gráfico
       ↓
🔎 Inspector (useInspector) escucha clicks en elementos
  → Permite sobrescribir estilo por elemento individual
  → Los overrides se aplican encima del config base
```

### 🎨 Sistema de personalización en 3 capas

```
🎨 Tema (paleta base)
  ↓ + ⚙️ Config (título, ejes, leyenda, gradientes, etc.)
  ↓ + 🔎 Overrides por elemento (color, opacidad, borde, label)
  = 📊 ECharts option final
```

### 🧩 Arquitectura de plugins de gráficos

Cada tipo de gráfico implementa la interfaz `ChartPlugin`:

```typescript
interface ChartPlugin {
  id: string
  label: string
  category: ChartCategory
  configSections: ConfigSection[]   // define los controles del ConfigPanel
  defaultConfig: ChartConfig        // valores iniciales
  buildOption(data, config, theme): EChartsOption  // genera la config de ECharts
}
```

El `registry.ts` centraliza el registro y permite descubrir charts por categoría o tipo de dato.

## 🛠️ Stack tecnológico

**⚛️ Frontend**
- React 19 + TypeScript
- Vite 8 como build tool
- Tailwind CSS 3 para estilos
- ECharts 6 (via echarts-for-react) para renderizado de gráficos
- Tauri 2 para el wrapper de desktop (Rust + WebView2)

**🐍 Backend**
- FastAPI + Uvicorn
- pandas + numpy para procesamiento de datos
- openpyxl para soporte XLSX
- Pydantic 2 para validación de esquemas
- Poetry para gestión de dependencias

## 🚀 Cómo ejecutar

### 📋 Requisitos

- Python 3.10+ y [Poetry](https://python-poetry.org/docs/#installation)
- Node.js 18+
- 🦀 Rust (solo para app desktop): `winget install Rustlang.Rustup`

### 🐍 Backend

```bash
cd backend
poetry install
poetry run uvicorn app.main:app --reload --port 8000
# 📖 Swagger UI en http://localhost:8000/docs
```

### 🌐 Frontend web

```bash
cd frontend
cp .env.example .env   # Ajustar VITE_API_URL=http://localhost:8000
npm install
npm run dev            # http://localhost:5173
```

### 🖥️ App de escritorio (Tauri)

```bash
cd frontend
cp .env.example .env
npm install
npm run tauri:dev      # Ventana nativa con hot reload
npm run tauri:build    # Genera instaladores en src-tauri/target/release/bundle/
```

## 📜 Scripts de referencia

| Directorio | Comando | Descripción |
|------------|---------|-------------|
| `backend` | `poetry run uvicorn app.main:app --reload` | 🐍 API en modo desarrollo |
| `frontend` | `npm run dev` | 🌐 App web en localhost:5173 |
| `frontend` | `npm run build` | 📦 Build SPA para producción |
| `frontend` | `npm run tauri:dev` | 🖥️ App desktop con hot reload |
| `frontend` | `npm run tauri:build` | 📦 Instaladores MSI/NSIS |

## 🗂️ Datos de prueba

El archivo `sample_data.csv` incluye un dataset pequeño (10 filas × 5 columnas) para probar la app sin necesidad de datos propios.
