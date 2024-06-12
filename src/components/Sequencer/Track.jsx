import React from 'react';

const Track = ({ data, row, toggleStep, currentStep, isMuted, handleMouseDown, handleMouseEnter, handleMouseUp }) => {
  return (
    <div className="sequencer">
      {Array.from({ length: 8 }, (_, groupIndex) => (
        <div className="group" key={groupIndex}>
          {data.slice(groupIndex * 4, (groupIndex + 1) * 4).map((step, stepIndex) => {
            const globalIndex = groupIndex * 4 + stepIndex;
            let stepClass = step !== 'empty' ? step : '';
            if (isMuted) {
              stepClass += ' muted';
            }
            return (
              <div
                key={globalIndex}
                className={`step ${stepClass} ${currentStep === globalIndex ? 'current' : ''}`}
                onMouseDown={() => handleMouseDown(globalIndex, row)}
                onMouseEnter={() => handleMouseEnter(globalIndex, row)}
                onMouseUp={handleMouseUp}
              ></div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Track;
