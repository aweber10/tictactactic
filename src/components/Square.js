function Square({ value, onClick, isActive }) {
  return (
    <button
      className={`square ${isActive ? 'active' : ''} ${value ? `square-${value}` : ''}`}
      onClick={onClick}
      disabled={value || !isActive}
      aria-label={value ? `${value} played here` : 'Empty square'}
    >
      {value}
    </button>
  );
}

export default Square;