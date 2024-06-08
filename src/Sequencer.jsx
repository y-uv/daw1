// src/Sequencer.jsx
import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import './Sequencer.css';

const Sequencer = () => {
  const steps = 16;
  const [stepData, setStepData] = useState(Array(steps).fill(false));
  const [tomData, setTomData] = useState(Array(steps).fill(false));
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);

  // Load the snare and tom sounds
  const snarePlayer = useRef(null);
  const tomPlayer = useRef(null);

  useEffect(() => {
    if (snarePlayer.current === null) {
      const player = new Tone.Player('/snare.mp3').toDestination();
      player.autostart = false;
      snarePlayer.current = player;
      console.log('Snare player initialized:', snarePlayer.current);
    }

    if (tomPlayer.current === null) {
      const player = new Tone.Player('/tom.mp3').toDestination();
      player.autostart = false;
      tomPlayer.current = player;
      console.log('Tom player initialized:', tomPlayer.current);
    }

    const sequence = new Tone.Sequence((time, step) => {
      if (stepData[step]) {
        playSound(snarePlayer.current, time);
      }
      if (tomData[step]) {
        playSound(tomPlayer.current, time);
      }
      setCurrentStep(step);
    }, Array.from({ length: steps }, (_, i) => i), '16n').start(0);

    Tone.Transport.bpm.value = bpm; //Needs to be Transport?    

    return () => {
      sequence.dispose();
    };
  }, [stepData, tomData, bpm]);

  const toggleStep = (step, row) => {
    if (row === 'snare') {
      const newStepData = stepData.map((s, stepIndex) => (stepIndex === step ? !s : s));
      setStepData(newStepData);
    } else if (row === 'tom') {
      const newTomData = tomData.map((s, stepIndex) => (stepIndex === step ? !s : s));
      setTomData(newTomData);
    }
  };

  const playSound = (player, time) => {
    console.log('Attempting to play sound at time', time);
    if (player) {
      console.log('Player loaded state:', player.loaded);
      if (player.loaded) {
        console.log('Playing sound');
        player.start(time); // Play the sound
      } else {
        console.log('Player is not loaded');
      }
    } else {
      console.log('Player not initialized');
    }
  };

  const startSequencer = () => {
    Tone.start().then(() => {
      console.log('Audio context started');
      Tone.Transport.start();
    }).catch((error) => {
      console.error('Error starting audio context:', error);
    });
  };

  const stopSequencer = () => {
    Tone.Transport.stop();
    setCurrentStep(0); // Reset to the beginning when stopped
  };

  const handleBpmChange = (event) => {
    setBpm(event.target.value);
    Tone.Transport.bpm.value = event.target.value;
  };

  const renderStepGroups = (data, row) => {
    return (
      <div className="sequencer">
        {Array.from({ length: 4 }, (_, groupIndex) => (
          <div className="group" key={groupIndex}>
            {data.slice(groupIndex * 4, (groupIndex + 1) * 4).map((step, stepIndex) => {
              const globalIndex = groupIndex * 4 + stepIndex;
              return (
                <div
                  key={globalIndex}
                  className={`step ${step ? 'active' : ''} ${currentStep === globalIndex ? 'current' : ''}`}
                  onClick={() => toggleStep(globalIndex, row)}
                ></div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <h1>yuvdaw</h1>
      {renderStepGroups(stepData, 'snare')}
      {renderStepGroups(tomData, 'tom')}
      <div className="controls">
        <div className="control-button" onClick={startSequencer}>
          <i className="fas fa-play"></i>
        </div>
        <div className="control-button" onClick={stopSequencer}>
          <i className="fas fa-pause"></i>
        </div>
      </div>
      <div className="bpm-control">
        <label htmlFor="bpm">BPM:</label>
        <input
          type="range"
          id="bpm"
          min="80"
          max="200"
          value={bpm}
          onChange={handleBpmChange}
        />
        <span>{bpm}</span>
      </div>
    </div>
  );
};

export default Sequencer;
