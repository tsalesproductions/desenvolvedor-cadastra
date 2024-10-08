export interface Color{
  name: string;
}

export interface Size{
  name: string;
}

export interface Price{
  min: number;
  max?: number;
}

export const colors: Color[] = [
  { name: 'Amarelo' },
  { name: 'Azul' },
  { name: 'Branco' },
  { name: 'Cinza' },
  { name: 'Laranja' },
  { name: 'Verde' },
  { name: 'Vermelho' },
  { name: 'Preto' },
  { name: 'Rosa' },
  { name: 'Vinho' },
];

export const sizes: Size[] = [
  { name: 'P' },
  { name: 'M' },
  { name: 'G' },
  { name: 'GG' },
  { name: 'U' },
  { name: '36' },
  { name: '38' },
  { name: '40' },
  { name: '44' },
  { name: '44' },
  { name: '46' },
];

export const prices: Price[] = [
  { min: 0, max: 50 },
  { min: 51, max: 150 },
  { min: 151, max: 300 },
  { min: 301, max: 500 },
  { min: 500 },
];

