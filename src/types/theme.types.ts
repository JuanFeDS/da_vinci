export interface Theme {
  id: string
  name: string
  colors: string[]
  backgroundColor: string
  gridColor: string
  textColor: string
  fontFamily: string
  fontSize: number
}

export const DEFAULT_THEMES: Theme[] = [
  {
    id: 'cosmic',
    name: 'Cosmic',
    colors: ['#7c6aff', '#a594ff', '#ff6b9d', '#ffa94d', '#69db7c', '#4dabf7'],
    backgroundColor: '#0c0e16',
    gridColor: 'rgba(255,255,255,0.06)',
    textColor: 'rgba(255,255,255,0.6)',
    fontFamily: 'Inter',
    fontSize: 12,
  },
  {
    id: 'aurora',
    name: 'Aurora',
    colors: ['#00d2ff', '#00b4d8', '#48cae4', '#90e0ef', '#ade8f4', '#caf0f8'],
    backgroundColor: '#0a1628',
    gridColor: 'rgba(0,210,255,0.08)',
    textColor: 'rgba(255,255,255,0.6)',
    fontFamily: 'Inter',
    fontSize: 12,
  },
  {
    id: 'ember',
    name: 'Ember',
    colors: ['#ff6b35', '#f7931e', '#ffd700', '#ff4757', '#ff6b81', '#eccc68'],
    backgroundColor: '#1a0a00',
    gridColor: 'rgba(255,107,53,0.08)',
    textColor: 'rgba(255,255,255,0.6)',
    fontFamily: 'Inter',
    fontSize: 12,
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2', '#b7e4c7'],
    backgroundColor: '#081c15',
    gridColor: 'rgba(82,183,136,0.08)',
    textColor: 'rgba(255,255,255,0.6)',
    fontFamily: 'Inter',
    fontSize: 12,
  },
  {
    id: 'neon',
    name: 'Neon',
    colors: ['#ff00ff', '#00ffff', '#ff00aa', '#00ff88', '#aa00ff', '#ffff00'],
    backgroundColor: '#050505',
    gridColor: 'rgba(255,0,255,0.08)',
    textColor: 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter',
    fontSize: 12,
  },
  {
    id: 'pastel',
    name: 'Pastel',
    colors: ['#ffd6e0', '#ffef9f', '#c3f0ca', '#a8d8ea', '#d4b9da', '#f9c784'],
    backgroundColor: '#1c1c2e',
    gridColor: 'rgba(255,255,255,0.06)',
    textColor: 'rgba(255,255,255,0.6)',
    fontFamily: 'Inter',
    fontSize: 12,
  },
]
