import { calculateWinner } from './gameUtils';

describe('calculateWinner utility', () => {
  // No winner tests
  test('returns null for empty board', () => {
    const squares = Array(9).fill(null);
    expect(calculateWinner(squares)).toBeNull();
  });

  test('returns null for partially filled board with no winner', () => {
    const squares = ['X', 'O', null, 'X', null, 'O', null, null, null];
    expect(calculateWinner(squares)).toBeNull();
  });

  // Horizontal win tests
  test('detects horizontal win in top row', () => {
    const squares = ['X', 'X', 'X', null, null, null, null, null, null];
    expect(calculateWinner(squares)).toBe('X');
  });

  test('detects horizontal win in middle row', () => {
    const squares = [null, null, null, 'O', 'O', 'O', null, null, null];
    expect(calculateWinner(squares)).toBe('O');
  });

  test('detects horizontal win in bottom row', () => {
    const squares = [null, null, null, null, null, null, 'X', 'X', 'X'];
    expect(calculateWinner(squares)).toBe('X');
  });

  // Vertical win tests
  test('detects vertical win in left column', () => {
    const squares = ['X', null, null, 'X', null, null, 'X', null, null];
    expect(calculateWinner(squares)).toBe('X');
  });

  test('detects vertical win in middle column', () => {
    const squares = [null, 'O', null, null, 'O', null, null, 'O', null];
    expect(calculateWinner(squares)).toBe('O');
  });

  test('detects vertical win in right column', () => {
    const squares = [null, null, 'X', null, null, 'X', null, null, 'X'];
    expect(calculateWinner(squares)).toBe('X');
  });

  // Diagonal win tests
  test('detects diagonal win from top-left to bottom-right', () => {
    const squares = ['X', null, null, null, 'X', null, null, null, 'X'];
    expect(calculateWinner(squares)).toBe('X');
  });

  test('detects diagonal win from top-right to bottom-left', () => {
    const squares = [null, null, 'O', null, 'O', null, 'O', null, null];
    expect(calculateWinner(squares)).toBe('O');
  });

  // Draw test
  test('detects draw when board is full with no winner', () => {
    const squares = ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'O'];
    expect(calculateWinner(squares)).toBe('draw');
  });
});
