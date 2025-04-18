import Square from './Square';

function SmallBoard({ board, onClick, isActive, winner }) {
  const renderSquare = (i) => {
    return (
      <Square
        key={i}
        value={board[i]}
        onClick={() => onClick(i)}
        isActive={isActive}
      />
    );
  };

  if (winner) {
    return (
      <div className={`small-board won-by-${winner}`}>
        <div className="winner">{winner}</div>
      </div>
    );
  }

  return (
    <div className={`small-board ${isActive ? 'active' : ''}`}>
      <div className="board-row">
        {renderSquare(0)}
        {renderSquare(1)}
        {renderSquare(2)}
      </div>
      <div className="board-row">
        {renderSquare(3)}
        {renderSquare(4)}
        {renderSquare(5)}
      </div>
      <div className="board-row">
        {renderSquare(6)}
        {renderSquare(7)}
        {renderSquare(8)}
      </div>
    </div>
  );
}

export default SmallBoard;
