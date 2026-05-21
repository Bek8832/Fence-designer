import { useState, useCallback } from 'react';
import { COLS, ROWS, SHAPES, COLORS, Piece } from '../constants';

export type BoardCell = { color: string; type: number; pieceId: string } | null;

const createEmptyBoard = () =>
  Array.from({ length: ROWS }, () => Array(COLS).fill(null));

const getRandomPieceType = () => {
  const types = Object.keys(SHAPES);
  return types[Math.floor(Math.random() * types.length)];
};

export function useFenceBuilder() {
  const [board, setBoard] = useState<BoardCell[][]>(createEmptyBoard());
  const [selectedPieceType, setSelectedPieceType] = useState<string | null>(null);
  const [availablePieces, setAvailablePieces] = useState<string[]>(() => [
    getRandomPieceType(),
    getRandomPieceType(),
    getRandomPieceType(),
  ]);

  const canPlace = useCallback((x: number, y: number, shape: number[][]) => {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        const boardX = x + col;
        const boardY = y + row;

        if (
          boardX < 0 ||
          boardX >= COLS ||
          boardY < 0 ||
          boardY >= ROWS ||
          board[boardY][boardX] !== null
        ) {
          return false;
        }
      }
    }
    return true;
  }, [board]);

  const placePiece = useCallback((x: number, y: number, color: string) => {
    if (!selectedPieceType) return;

    const shape = SHAPES[selectedPieceType];
    if (canPlace(x, y, shape)) {
      const newBoard = board.map(row => [...row]);
      const pieceId = Math.random().toString(36).substr(2, 9);

      shape.forEach((rowArr, rowIdx) => {
        rowArr.forEach((value, colIdx) => {
          if (value) {
            newBoard[y + rowIdx][x + colIdx] = { color, type: value, pieceId };
          }
        });
      });

      setBoard(newBoard);
      return true;
    }
    return false;
  }, [selectedPieceType, board, canPlace]);

  const removePiece = useCallback((x: number, y: number) => {
     const cell = board[y][x];
     if (!cell) return;

     const pieceId = cell.pieceId;
     const newBoard = board.map(row => 
       row.map(c => (c && c.pieceId === pieceId ? null : c))
     );
     setBoard(newBoard);
  }, [board]);

  const resetBoard = () => {
    setBoard(createEmptyBoard());
  };

  const getNewAvailablePiece = (index: number) => {
    const newPieces = [...availablePieces];
    newPieces[index] = getRandomPieceType();
    setAvailablePieces(newPieces);
  };

  return {
    board,
    selectedPieceType,
    setSelectedPieceType,
    availablePieces,
    getNewAvailablePiece,
    placePiece,
    removePiece,
    resetBoard,
  };
}
