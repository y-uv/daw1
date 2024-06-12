import React from 'react';

const Overlay = ({ startSequencer }) => {
  return (
    <div className="overlay" onClick={startSequencer}>
      <div className="overlay-content">
        <p>interact 2 start</p>
      </div>
    </div>
  );
};

export default Overlay;
