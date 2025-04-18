function Square({ value, onClick, isActive }) {
  return (
    <button
      className={`square ${isActive ? 'active' : ''}`}
      onClick={onClick}
      disabled={value || !isActive}
    >
      {value}
    </button>
  );
}

export default Square;
