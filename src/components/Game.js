import { useState } from 'react';
import BigBoard from './BigBoard';

function Game() {
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = () => {
    setGameStarted(true);
  };

  if (!gameStarted) {
    return (
      <div className="start-screen">
        <h1>TicTacTactic</h1>
        <h2>Ultimate Tic-Tac-Toe</h2>
        <div className="rules">
          <h3>Rules:</h3>
          <ul>
            <li>The board consists of 9 small tic-tac-toe boards arranged in a 3×3 grid</li>
            <li>First move can be made anywhere</li>
            <li>The position of your move in a small board determines where the next player must play</li>
            <li>Win small boards by getting 3 in a row</li>
            <li>Win the game by winning 3 small boards in a row</li>
          </ul>
        </div>
        <button className="start-button" onClick={startGame}>Start Game</button>
      </div>
    );
  }

  return (
    <div className="game-container">
      <BigBoard />
    </div>
  );
}

export default Game;