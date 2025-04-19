import { useState } from 'react';
import BigBoard from './BigBoard';
import MetaBoard from './MetaBoard';

function Game() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameMode, setGameMode] = useState(null); // 'normal' or 'hardcore'

  const startGame = (mode) => {
    setGameMode(mode);
    setGameStarted(true);
  };

  // Go back to mode selection
  const backToModeSelection = () => {
    setGameStarted(false);
    setGameMode(null);
  };

  if (!gameStarted) {
    return (
      <div className="start-screen">
        <h1>TicTacTactic</h1>
        <h2>Ultimate Tic-Tac-Toe</h2>
        
        <div className="game-mode-selection">
          <h3>Select Game Mode:</h3>
          
          <div className="game-modes">
            <div className="game-mode">
              <h4>Normal Mode</h4>
              <p>Classic Ultimate Tic-Tac-Toe with nested boards. Win three small boards in a row.</p>
              <button className="start-button" onClick={() => startGame('normal')}>Start Normal Game</button>
            </div>
            
            <div className="game-mode">
              <h4>Hardcore Duel Mode</h4>
              <p>Ultra-strategic meta game where you play multiple Ultimate games arranged in a 3×3 grid.</p>
              <button className="start-button hardcore" onClick={() => startGame('hardcore')}>Start Hardcore Duel</button>
            </div>
          </div>
        </div>
        
        <div className="rules">
          <h3>Normal Mode Rules:</h3>
          <ul>
            <li>The board consists of 9 small tic-tac-toe boards arranged in a 3×3 grid</li>
            <li>First move can be made anywhere</li>
            <li>The position of your move in a small board determines where the next player must play</li>
            <li>Win small boards by getting 3 in a row</li>
            <li>Win the game by winning 3 small boards in a row</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <button className="back-button" onClick={backToModeSelection}>← Change Game Mode</button>
      {gameMode === 'normal' ? <BigBoard /> : <MetaBoard />}
    </div>
  );
}

export default Game;