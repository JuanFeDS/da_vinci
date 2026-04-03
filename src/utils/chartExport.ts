import type { ECharts } from 'echarts'

export function exportChartAsPNG(instance: ECharts, filename = 'davinci-chart'): void {
  const url = instance.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: 'transparent',
  })
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.png`
  a.click()
}
