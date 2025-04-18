import './App.css';
import Game from './components/Game';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>TicTacTactic</h1>
      </header>
      <main>
        <Game />
      </main>
      <footer>
        <p>© 2025 TicTacTactic - Ultimate Tic-Tac-Toe</p>
      </footer>
    </div>
  );
}

export default App;