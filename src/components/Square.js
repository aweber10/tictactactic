function Square({ value, onClick, isActive }) {
  return (
    <button
      className={`square ${isActive ? 'active' : ''} ${value ? `square-${value}` : ''}`}
      onClick={onClick}
      disabled={value || !isActive}
      aria-label={value ? `${value} played here` : 'Empty square'}
    >
      {/* No need for text content as we use ::before in CSS */}
    </button>
  );
}

export default Square;