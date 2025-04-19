import React from 'react';

// Using React.memo to avoid unnecessary re-renders
const Square = React.memo(({ value, onClick, isActive }) => {
  return (
    <button
      className={`square ${isActive ? 'active' : ''} ${value ? `square-${value}` : ''}`}
      onClick={onClick}
      disabled={!isActive}
      aria-label={value ? `${value} played here` : 'Empty square'}
    >
      {value}
    </button>
  );
});

export default Square;