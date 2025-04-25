import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import UltimateGame from './UltimateGame';
import { calculateWinner } from '../utils/gameUtils';

// Mock der gameUtils-Funktionen
jest.mock('../utils/gameUtils', () => ({
  calculateWinner: jest.fn()
}));

describe('UltimateGame Component', () => {
  // Standard-Props für die Tests
  const defaultProps = {
    gameIndex: 0,
    gameData: {
      boards: Array(9).fill(null).map(() => Array(9).fill(null)),
      smallWinners: Array(9).fill(null),
      winner: null,
      lastWinPosition: null
    },
    xIsNext: true,
    isActive: true,
    onGameWin: jest.fn(),
    updateGameState: jest.fn()
  };

  beforeEach(() => {
    // Reset der Mocks vor jedem Test
    jest.clearAllMocks();
    // Standard-Verhalten für calculateWinner: kein Gewinner
    calculateWinner.mockImplementation(() => null);
  });

  test('rendert das Spiel mit 9 kleinen Boards', () => {
    render(<UltimateGame {...defaultProps} />);
    
    // Prüfen, ob 9 kleine Boards gerendert werden
    const smallBoards = document.querySelectorAll('.small-board');
    expect(smallBoards.length).toBe(9);
  });

  test('zeigt den korrekten Spielstatus an', () => {
    render(<UltimateGame {...defaultProps} />);
    
    // Prüfen, ob der Status "Next player: X" angezeigt wird
    expect(screen.getByText('Next player: X')).toBeInTheDocument();
  });

  test('Spieler können abwechselnd Züge machen', () => {
    const { rerender } = render(<UltimateGame {...defaultProps} />);
    
    // Simuliere einen Klick auf ein Feld im ersten Board
    const squares = document.querySelectorAll('.square');
    fireEvent.click(squares[0]); // Klick auf das erste Feld im ersten Board
    
    // Überprüfe, ob updateGameState aufgerufen wurde
    expect(defaultProps.updateGameState).toHaveBeenCalled();
    
    // Simuliere den nächsten Spieler (O)
    rerender(<UltimateGame {...defaultProps} xIsNext={false} />);
    
    // Prüfen, ob der Status "Next player: O" angezeigt wird
    expect(screen.getByText('Next player: O')).toBeInTheDocument();
  });

  test('der nächste zu spielende Board wird korrekt bestimmt', () => {
    // Erstelle ein Spiel mit einem bereits gemachten Zug
    const modifiedProps = {
      ...defaultProps,
      gameData: {
        ...defaultProps.gameData,
        boards: defaultProps.gameData.boards.map((board, index) => 
          index === 0 ? [...board.slice(0, 4), 'X', ...board.slice(5)] : board
        )
      }
    };
    
    render(<UltimateGame {...modifiedProps} />);
    
    // Simuliere einen Klick auf ein Feld im Board 4 (entspricht dem Index 4 des ersten Zugs)
    const boardFourSquares = document.querySelectorAll('.small-board')[4].querySelectorAll('.square');
    fireEvent.click(boardFourSquares[0]);
    
    // Überprüfe, ob updateGameState mit dem richtigen nextBoardIndex aufgerufen wurde
    expect(defaultProps.updateGameState).toHaveBeenCalled();
    
    // Der Aufruf sollte den nächsten Board-Index auf 0 setzen (basierend auf dem geklickten Feld)
    const updateCall = defaultProps.updateGameState.mock.calls[0][0];
    expect(updateCall.boards[4][0]).toBe('O');
  });

  test('ein Spielfeld kann gewonnen werden und wird korrekt markiert', () => {
    // Mock calculateWinner, um einen Gewinn zurückzugeben
    calculateWinner.mockImplementation(() => 'X');
    
    render(<UltimateGame {...defaultProps} />);
    
    // Simuliere einen Klick, der zu einem Gewinn führt
    const squares = document.querySelectorAll('.square');
    fireEvent.click(squares[0]);
    
    // Überprüfe, ob updateGameState mit dem richtigen smallWinners aufgerufen wurde
    expect(defaultProps.updateGameState).toHaveBeenCalled();
    const updateCall = defaultProps.updateGameState.mock.calls[0][0];
    expect(updateCall.smallWinners[0]).toBe('X');
  });

  test('nach einem gewonnenen Board können weitere Züge gemacht werden', () => {
    // Erstelle ein Spiel mit einem bereits gewonnenen Board
    const modifiedProps = {
      ...defaultProps,
      gameData: {
        ...defaultProps.gameData,
        smallWinners: [
          'X', null, null,
          null, null, null,
          null, null, null
        ]
      }
    };
    
    render(<UltimateGame {...modifiedProps} />);
    
    // Simuliere einen Klick auf ein Feld in einem anderen Board
    const boardTwoSquares = document.querySelectorAll('.small-board')[2].querySelectorAll('.square');
    fireEvent.click(boardTwoSquares[0]);
    
    // Überprüfe, ob updateGameState aufgerufen wurde
    expect(defaultProps.updateGameState).toHaveBeenCalled();
    const updateCall = defaultProps.updateGameState.mock.calls[0][0];
    expect(updateCall.boards[2][0]).toBe('X');
  });

  test('der ultimative Gewinner wird korrekt ermittelt', () => {
    // Erstelle ein Spiel mit fast gewonnenem Spiel
    const modifiedProps = {
      ...defaultProps,
      gameData: {
        ...defaultProps.gameData,
        smallWinners: [
          'X', 'X', null,
          null, null, null,
          null, null, null
        ]
      }
    };
    
    // Mock calculateWinner, um einen Gewinn zurückzugeben
    calculateWinner.mockImplementation(() => 'X');
    
    render(<UltimateGame {...modifiedProps} />);
    
    // Simuliere einen Klick, der zum ultimativen Gewinn führt
    const boardThreeSquares = document.querySelectorAll('.small-board')[2].querySelectorAll('.square');
    fireEvent.click(boardThreeSquares[0]);
    
    // Überprüfe, ob onGameWin aufgerufen wurde
    expect(defaultProps.onGameWin).toHaveBeenCalledWith(0, 'X', 2);
  });

  test('ein Unentschieden wird korrekt erkannt', () => {
    // Mock calculateWinner, um ein Unentschieden zurückzugeben
    calculateWinner.mockImplementation(() => 'draw');
    
    // Erstelle ein Spiel mit fast vollem Board
    const modifiedProps = {
      ...defaultProps,
      gameData: {
        ...defaultProps.gameData,
        smallWinners: [
          'draw', 'draw', 'draw',
          'draw', 'draw', 'draw',
          'draw', 'draw', null
        ]
      }
    };
    
    render(<UltimateGame {...modifiedProps} />);
    
    // Simuliere einen Klick auf das letzte Board
    const lastBoardSquares = document.querySelectorAll('.small-board')[8].querySelectorAll('.square');
    fireEvent.click(lastBoardSquares[0]);
    
    // Überprüfe, ob updateGameState mit dem richtigen smallWinners aufgerufen wurde
    expect(defaultProps.updateGameState).toHaveBeenCalled();
    const updateCall = defaultProps.updateGameState.mock.calls[0][0];
    expect(updateCall.smallWinners[8]).toBe('draw');
    
    // Überprüfe, ob der Status ein Unentschieden anzeigt
    expect(screen.getByText('Game ended in a draw')).toBeInTheDocument();
  });

  test('wenn ein Spieler zu einem bereits gewonnenen Board geschickt wird, darf er ein beliebiges Board wählen', () => {
    // Erstelle ein Spiel mit einem bereits gewonnenen Board 4
    const modifiedProps = {
      ...defaultProps,
      gameData: {
        ...defaultProps.gameData,
        boards: defaultProps.gameData.boards.map((board, index) => 
          index === 0 ? [...board.slice(0, 4), 'X', ...board.slice(5)] : board
        ),
        smallWinners: [
          null, null, null,
          null, 'X', null,
          null, null, null
        ]
      }
    };
    
    render(<UltimateGame {...modifiedProps} />);
    
    // Simuliere einen Klick auf ein Feld in Board 1 (sollte erlaubt sein, da Board 4 bereits gewonnen ist)
    const boardOneSquares = document.querySelectorAll('.small-board')[1].querySelectorAll('.square');
    fireEvent.click(boardOneSquares[0]);
    
    // Überprüfe, ob updateGameState aufgerufen wurde
    expect(defaultProps.updateGameState).toHaveBeenCalled();
    const updateCall = defaultProps.updateGameState.mock.calls[0][0];
    expect(updateCall.boards[1][0]).toBe('X');
  });

  test('verhindert Züge auf bereits belegte Felder', () => {
    // Erstelle ein Spiel mit einem bereits belegten Feld
    const modifiedProps = {
      ...defaultProps,
      gameData: {
        ...defaultProps.gameData,
        boards: defaultProps.gameData.boards.map((board, index) => 
          index === 0 ? ['X', ...board.slice(1)] : board
        )
      }
    };
    
    render(<UltimateGame {...modifiedProps} />);
    
    // Simuliere einen Klick auf das bereits belegte Feld
    const firstSquare = document.querySelectorAll('.square')[0];
    fireEvent.click(firstSquare);
    
    // Überprüfe, ob updateGameState NICHT aufgerufen wurde
    expect(defaultProps.updateGameState).not.toHaveBeenCalled();
  });

  test('verhindert Züge auf inaktive Boards', () => {
    // Erstelle ein Spiel mit einem vorherigen Zug, der zu Board 4 führt
    const modifiedProps = {
      ...defaultProps,
      gameData: {
        ...defaultProps.gameData,
        boards: defaultProps.gameData.boards.map((board, index) => 
          index === 0 ? [...board.slice(0, 4), 'X', ...board.slice(5)] : board
        )
      }
    };
    
    render(<UltimateGame {...modifiedProps} />);
    
    // Simuliere einen Klick auf ein Feld in Board 1 (sollte nicht erlaubt sein)
    const boardOneSquares = document.querySelectorAll('.small-board')[1].querySelectorAll('.square');
    fireEvent.click(boardOneSquares[0]);
    
    // Überprüfe, ob updateGameState NICHT aufgerufen wurde
    expect(defaultProps.updateGameState).not.toHaveBeenCalled();
  });

  test('verhindert weitere Züge nach einem ultimativen Gewinn', () => {
    // Erstelle ein Spiel mit einem ultimativen Gewinner
    const modifiedProps = {
      ...defaultProps,
      gameData: {
        ...defaultProps.gameData,
        winner: 'X'
      }
    };
    
    render(<UltimateGame {...modifiedProps} />);
    
    // Simuliere einen Klick auf ein beliebiges Feld
    const squares = document.querySelectorAll('.square');
    fireEvent.click(squares[0]);
    
    // Überprüfe, ob updateGameState NICHT aufgerufen wurde
    expect(defaultProps.updateGameState).not.toHaveBeenCalled();
    
    // Überprüfe, ob der Status den Gewinner anzeigt
    expect(screen.getByText('Ultimate Winner: X')).toBeInTheDocument();
  });

  test('zeigt den korrekten Status für inaktive Spiele an', () => {
    render(<UltimateGame {...defaultProps} isActive={false} />);
    
    // Prüfen, ob der Status "Viewing only - not your turn" angezeigt wird
    expect(screen.getByText('Viewing only - not your turn')).toBeInTheDocument();
  });

  test('zeigt den korrekten Board-Index im Status an', () => {
    // Erstelle ein Spiel mit einem vorherigen Zug, der zu Board 4 führt
    const modifiedProps = {
      ...defaultProps,
      gameData: {
        ...defaultProps.gameData,
        boards: defaultProps.gameData.boards.map((board, index) => 
          index === 0 ? [...board.slice(0, 4), 'X', ...board.slice(5)] : board
        )
      }
    };
    
    render(<UltimateGame {...modifiedProps} />);
    
    // Prüfen, ob der Status den Board-Index anzeigt
    expect(screen.getByText('Next player: X (Board 5)')).toBeInTheDocument();
  });
});
