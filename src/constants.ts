export type Point = { x: number; y: number };
export type Shape = number[][];

export interface Piece {
  position: Point;
  shape: Shape;
  color: string;
}

export const COLS = 23;
export const ROWS = 11;
export const BLOCK_SIZE = 30;

export const SHAPES: { [key: string]: Shape } = {
  HALF: [[1]],
  FULL: [[1, 1]],
  TUMBA: [
    [2, 2],
    [2, 2],
  ],
};

export const BUILDER_COLORS = [
  { id: 'gray', name: 'Боз', classes: 'bg-stone-400 border-stone-500' },
  { id: 'darkgray', name: 'Кочкул боз', classes: 'bg-stone-700 border-stone-800' },
  { id: 'white', name: 'Ак', classes: 'bg-white border-black shadow-[inset_0_0_2px_rgba(0,0,0,0.2)]' },
  { id: 'darkred', name: 'Кочкул кызыл', classes: 'bg-red-900 border-red-950' },
  { id: 'sand', name: 'Кум түс', classes: 'bg-amber-200 border-amber-300' },
  { id: 'brown', name: 'Күрөң', classes: 'bg-orange-950 border-stone-900' },
];

export const COLORS = {
  HALF: 'bg-stone-300 border-stone-400',
  FULL: 'bg-stone-300 border-stone-400',
  TUMBA: 'bg-stone-500 border-stone-600',
};

export const KEY_CODES = {
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  DOWN: 'ArrowDown',
  UP: 'ArrowUp',
  SPACE: 'Space',
};
