import React from 'react';

const Controls = ({ startSequencer, stopSequencer, clearAll, toggleVelocity, velocityToggle }) => {
  return (
    <div className="controls">
      <div
        className="control-button2"
        onClick={toggleVelocity}
        style={{
          color: velocityToggle === 'heavy' ? '#283444' : '#aaa',
        }}
      >
        <i className="fas fa-pencil"></i>
      </div>
      <div className="control-button" onClick={startSequencer}>
        <i className="fas fa-play"></i>
      </div>
      <div className="control-button" onClick={stopSequencer}>
        <i className="fas fa-stop"></i>
      </div>
      <button onClick={clearAll}>clear all</button>
    </div>
  );
};

export default Controls;
