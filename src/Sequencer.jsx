import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import './Sequencer.css';

const Sequencer = () => {
  const steps = 16;
  const [stepData, setStepData] = useState(Array(steps).fill(false));
  const [tomData, setTomData] = useState(Array(steps).fill(false));
  const [hatData, setHatData] = useState(Array(steps).fill(false));
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);

  const [tapTimes, setTapTimes] = useState([]);
  const [tapBpm, setTapBpm] = useState(null);
  const tapTimeoutRef = useRef(null);

  const snarePlayer = useRef(null);
  const tomPlayer = useRef(null);
  const hatPlayer = useRef(null);

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

    if (hatPlayer.current === null) {
      const player = new Tone.Player('/hat.mp3').toDestination();
      player.autostart = false;
      hatPlayer.current = player;
      console.log('Hat player initialized:', hatPlayer.current);
    }

    const sequence = new Tone.Sequence((time, step) => {
      if (stepData[step]) {
        playSound(snarePlayer.current, time);
      }
      if (tomData[step]) {
        playSound(tomPlayer.current, time);
      }
      if (hatData[step]) {
        playSound(hatPlayer.current, time);
      }
      setCurrentStep(step);
    }, Array.from({ length: steps }, (_, i) => i), '16n').start(0);

    Tone.Transport.bpm.value = bpm;

    return () => {
      sequence.dispose();
    };
  }, [stepData, tomData, hatData, bpm]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key.toLowerCase() === 'k') {
        const now = Date.now();
        setTapTimes((prevTapTimes) => {
          const newTapTimes = [...prevTapTimes, now];
          if (newTapTimes.length > 1) {
            const intervals = newTapTimes.slice(1).map((time, i) => time - newTapTimes[i]);
            const avgInterval = intervals.reduce((acc, curr) => acc + curr, 0) / intervals.length;
            const newBpm = 60000 / avgInterval;
            setTapBpm(newBpm.toFixed(2));
          }
          if (newTapTimes.length > 30) {
            newTapTimes.shift();
          }
          resetTapTimeout();
          return newTapTimes;
        });
      }
    };

    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, []);

  const resetTapTimeout = () => {
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = setTimeout(resetTapBpm, 3000);
  };

  const resetTapBpm = () => {
    setTapTimes([]);
    setTapBpm(null);
  };

  const toggleStep = (step, row) => {
    if (row === 'snare') {
      const newStepData = stepData.map((s, stepIndex) => (stepIndex === step ? !s : s));
      setStepData(newStepData);
    } else if (row === 'tom') {
      const newTomData = tomData.map((s, stepIndex) => (stepIndex === step ? !s : s));
      setTomData(newTomData);
    } else if (row === 'hat') {
      const newHatData = hatData.map((s, stepIndex) => (stepIndex === step ? !s : s));
      setHatData(newHatData);
    }
  };

  const playSound = (player, time) => {
    console.log('Attempting to play sound at time', time);
    if (player) {
      console.log('Player loaded state:', player.loaded);
      if (player.loaded) {
        console.log('Playing sound');
        player.start(time);
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
    setCurrentStep(0);
  };

  const constrainBpm = (value) => {
    return Math.max(80, Math.min(200, value));
  };

  useEffect(() => {
    const constrainedBpm = constrainBpm(bpm);
    Tone.Transport.bpm.value = constrainedBpm;
    updateSliderColor(constrainedBpm); // Update slider color based on constrained BPM
  }, [bpm]);

  const handleBpmChange = (event) => {
    const newBpm = parseInt(event.target.value);
    setBpm(constrainBpm(newBpm));
  };

  const handleBpmInputChange = (event) => {
    setBpm(event.target.value);
  };

  const handleBpmInputBlur = (event) => {
    let newBpm = parseInt(event.target.value);
    if (isNaN(newBpm) || newBpm < 80) {
      newBpm = 80;
    } else if (newBpm > 200) {
      newBpm = 200;
    }
    setBpm(newBpm);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      let newBpm = parseInt(event.target.value);
      setBpm(constrainBpm(newBpm));
    }
  };

  const updateSliderColor = (value) => {
    const percentage = (value - 80) / (200 - 80);
    const red = Math.round(255 * percentage);
    const blue = 255 - red;
    const slider = document.getElementById('bpm');
    slider.style.background = `rgb(${red}, 0, ${blue})`;
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

  const renderDotRow = () => {
    const groups = Array.from({ length: 4 }, (_, groupIndex) => (
      <div className="dot-group" key={groupIndex}>
        {Array.from({ length: 4 }, (_, index) => {
          const globalIndex = groupIndex * 4 + index;
          return (
            <div key={globalIndex} className="dot-container">
              <div className={`dot ${currentStep === globalIndex ? 'current' : ''}`}></div>
            </div>
          );
        })}
      </div>
    ));
  
    return <div className="dot-row">{groups}</div>;
  };
  
  return (
    <div>
      <img src="/yuvdaw.jpg" alt="yuvdaw" className="custom-logo" />
      <div className="main-container"> {/* [NEW] Wrap everything inside this */}
        <div className="label-container">
          <div className="label">hat</div>
          <div className="label">snare</div>
          <div className="label">kick</div>
        </div>
        <div className="sequencer-container">
          {renderDotRow()}
          {renderStepGroups(hatData, 'hat')}
          {renderStepGroups(stepData, 'snare')}
          {renderStepGroups(tomData, 'tom')}
        </div>
      </div>
      <div className="controls">
        <div className="control-button" onClick={startSequencer}>
          <i className="fas fa-play"></i>
        </div>
        <div className="control-button" onClick={stopSequencer}>
          <i className="fas fa-pause"></i>
        </div>
        <button onClick={() => { setStepData(Array(steps).fill(false)); setTomData(Array(steps).fill(false)); setHatData(Array(steps).fill(false)); }}>clear</button>
      </div>
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
          className="bpm-input" /* [NEW] Add class for styling */
        />
      </div>
      <div className="tap-bpm">
        <button onClick={resetTapBpm}>reset</button>
        <label>(tap k)</label>
        <span className="tap-value">{tapBpm !== null ? tapBpm : '???'}</span>
      </div>
    </div>
  );
};

export default Sequencer;
