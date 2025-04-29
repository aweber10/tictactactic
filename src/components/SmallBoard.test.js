import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SmallBoard from './SmallBoard';

describe('SmallBoard Component', () => {
  // Default props for testing
  const defaultProps = {
    board: Array(9).fill(null),
    onClick: jest.fn(),
    isActive: true,
    winner: null
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('renders a 3x3 grid of squares', () => {
    render(<SmallBoard {...defaultProps} />);
    
    // Check if 9 squares are rendered
    const squares = screen.getAllByRole('button');
    expect(squares).toHaveLength(9);
  });

  test('squares are clickable when isActive is true, winner is null, and square is empty', () => {
    render(<SmallBoard {...defaultProps} />);
    
    // Click on the first square (which is empty)
    const squares = screen.getAllByRole('button');
    fireEvent.click(squares[0]);
    
    // Check if onClick was called with the correct index
    expect(defaultProps.onClick).toHaveBeenCalledWith(0);
  });

  test('squares are not clickable when isActive is false', () => {
    render(<SmallBoard {...defaultProps} isActive={false} />);
    
    // Try to click on the first square
    const squares = screen.getAllByRole('button');
    fireEvent.click(squares[0]);
    
    // Check that onClick was not called
    expect(defaultProps.onClick).not.toHaveBeenCalled();
  });

  test('squares are not clickable when the board has a winner', () => {
    render(<SmallBoard {...defaultProps} winner="X" />);
    
    // Try to click on the first square
    const squares = screen.getAllByRole('button');
    fireEvent.click(squares[0]);
    
    // Check that onClick was not called
    expect(defaultProps.onClick).not.toHaveBeenCalled();
  });

  test('squares are not clickable when they are already filled', () => {
    // Create a board with the first square filled
    const boardWithFilledSquare = ['X', null, null, null, null, null, null, null, null];
    
    render(<SmallBoard {...defaultProps} board={boardWithFilledSquare} />);
    
    // Try to click on the first square (which is already filled)
    const squares = screen.getAllByRole('button');
    fireEvent.click(squares[0]);
    
    // Check that onClick was not called
    expect(defaultProps.onClick).not.toHaveBeenCalled();
  });

  test('displays the winner when there is one', () => {
    render(<SmallBoard {...defaultProps} winner="X" />);
    
    // Check if the winner is displayed
    expect(screen.getByText('X')).toBeInTheDocument();
    
    // Check that the board has the winner class
    const board = screen.getByTestId('small-board');
    expect(board).toHaveClass('winner-X');
  });

  test('applies active class when isActive is true', () => {
    render(<SmallBoard {...defaultProps} />);
    
    // Check that the board has the active class
    const board = screen.getByTestId('small-board');
    expect(board).toHaveClass('active');
  });

  test('does not apply active class when isActive is false', () => {
    render(<SmallBoard {...defaultProps} isActive={false} />);
    
    // Check that the board does not have the active class
    const board = screen.getByTestId('small-board');
    expect(board).not.toHaveClass('active');
  });
});
