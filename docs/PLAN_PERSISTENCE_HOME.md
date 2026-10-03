# Plan: Persistencia + Home

## Feature 1 — Persistencia + Pestañas

### Modelo de datos
Cada visualización es un objeto `Visualization`:
- `id` — uuid generado al crear
- `name` — nombre editable por el usuario (default: "Visualización 1", "Visualización 2", etc.)
- `pluginId` — tipo de gráfico
- `config` — ChartConfig completo (ejes, colores, filtros, text blocks, etc.)
- `data` — ProcessedData completo (dataset incluido)
- `themeId` — tema activo
- `inspectorOverrides` — overrides del inspector (ya dentro de config.elementOverrides)
- `createdAt` / `updatedAt` — timestamps

### Storage
- **IndexedDB** — store `visualizations` con clave `id`
- Funciones: `saveVisualization`, `loadVisualization`, `listVisualizations`, `deleteVisualization`

### Auto-save
- Debounce de ~1s en cada cambio de config, data o tema
- Indicador visual en la pestaña activa: "Guardado ✓" / "Guardando..."

### Pestañas
- Barra de pestañas en la parte superior del editor
- Cada pestaña: nombre (editable con doble clic), botón cerrar (×), punto naranja si hay cambios sin guardar
- Botón **+** para nueva visualización en blanco
- Opción de duplicar la pestaña activa (desde menú o botón)
- Estado global: `tabs: Visualization[]` + `activeTabId: string`

---

## Feature 2 — Home

### Pantalla
- Logo + nombre centrados (estilo minimal, fondo oscuro igual que el editor)
- Botón principal grande: **"Nueva visualización"**
- Grid de recientes: nombre, ícono del tipo de gráfico, nombre del dataset, fecha
  - Click → abre en editor
  - Hover → muestra botón eliminar de recientes
- Botón secundario: **"Importar JSON"** (carga config exportada previamente)
- Sin recientes: mensaje vacío minimalista

### Navegación
- Estado raíz de la app: `screen: 'home' | 'editor'`
- Desde el editor: botón en el header con el logo/nombre vuelve al home
- Al crear nueva visualización desde home → navega a editor con pestaña nueva

---

## Orden de implementación

1. Tipos y utilidades de persistencia (`src/types/visualization.types.ts`, `src/utils/visualizationStore.ts`)
2. Hook `useVisualizations` — gestión de tabs + auto-save
3. Componente `TabBar`
4. Refactor `App.tsx` — integrar tabs y screen state
5. Componente `HomeScreen`
6. Ajustes finales de UX (indicador guardado, nombre editable, duplicar)
