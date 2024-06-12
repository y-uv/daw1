import React from 'react';

const BPMControl = ({ bpm, handleBpmChange, handleBpmInputChange, handleBpmInputBlur, handleKeyDown, tapBpm, resetTapBpm }) => {
  return (
    <div className="bpm-control">
      <label htmlFor="bpm">bpm:</label>
      <input
        type="range"
        id="bpm"
        min="80"
        max="200"
        value={bpm}
        onChange={handleBpmChange}
      />
      <input
        type="number"
        min="80"
        max="200"
        value={bpm}
        onChange={handleBpmInputChange}
        onBlur={handleBpmInputBlur}
        onKeyDown={handleKeyDown}
        className="bpm-input"
      />
    </div>
  );
};

export default BPMControl;
