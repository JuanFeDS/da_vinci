// Shared config section control definitions for stacked-style charts
// (StackedBarChart, AreaChart, and future variants)

export const STACK_DATA_CONTROLS = [
  { key: 'xAxis',     label: 'Eje X (categorías)',   type: 'select' as const, defaultValue: '' },
  { key: 'valueCol',  label: 'Columna de valor (Y)',  type: 'select' as const, defaultValue: '' },
  { key: 'stackCol',  label: 'Columna de agrupación', type: 'select' as const, defaultValue: '' },
  { key: 'title',      label: 'Título del gráfico',  type: 'text' as const, defaultValue: '' },
  { key: 'xAxisTitle', label: 'Título eje X',         type: 'text' as const, defaultValue: '' },
  { key: 'yAxisTitle', label: 'Título eje Y',         type: 'text' as const, defaultValue: '' },
]

const LEGEND_POSITION_OPTIONS = [
  { label: 'Abajo',    value: 'bottom' },
  { label: 'Arriba',   value: 'top'    },
  { label: 'Izquierda', value: 'left'  },
  { label: 'Derecha',  value: 'right'  },
]

export const STACK_DISPLAY_CONTROLS = [
  { key: 'showLegend',     label: 'Mostrar leyenda',    type: 'switch' as const, defaultValue: true },
  { key: 'legendPosition', label: 'Posición leyenda',   type: 'select' as const, defaultValue: 'bottom', options: LEGEND_POSITION_OPTIONS },
  { key: 'showGrid',       label: 'Mostrar cuadrícula', type: 'switch' as const, defaultValue: true },
  { key: 'percentMode',    label: 'Modo 100%',          type: 'switch' as const, defaultValue: false },
  { key: 'showDataZoom',   label: 'Barra de rango (X)', type: 'switch' as const, defaultValue: false },
]

export const SHARED_STACK_DEFAULT_CONFIG = {
  xAxis: '', yAxis: '', valueCol: '', stackCol: '',
  title: '', xAxisTitle: '', yAxisTitle: '',
  showLegend: true, legendPosition: 'bottom', showGrid: true,
  percentMode: false, showDataZoom: false,
  labelOverrides: {}, seriesNameOverrides: {},
  numericColumns: [], colorMode: 'uniform' as const, colorField: '', colorMap: {}, elementOverrides: {},
}
