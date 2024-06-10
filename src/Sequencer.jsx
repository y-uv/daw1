import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import './Sequencer.css';

const Sequencer = () => {
  const steps = 16;
  const [stepData, setStepData] = useState(Array(steps).fill('empty'));
  const [tomData, setTomData] = useState(Array(steps).fill('empty'));
  const [hatData, setHatData] = useState(Array(steps).fill('empty'));
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);
  const [velocityToggle, setVelocityToggle] = useState('heavy');
  const [mute, setMute] = useState({ snare: false, tom: false, hat: false });

  const [tapTimes, setTapTimes] = useState([]);
  const [tapBpm, setTapBpm] = useState(null);
  const tapTimeoutRef = useRef(null);

  const snarePlayer = useRef(null);
  const tomPlayer = useRef(null);
  const hatPlayer = useRef(null);

  const [hatVolume, setHatVolume] = useState(-22);
  const [snareVolume, setSnareVolume] = useState(-20);
  const [kickVolume, setKickVolume] = useState(-18);

  useEffect(() => {
    if (snarePlayer.current === null) {
      const player = new Tone.Player('/snap.mp3').toDestination();
      player.volume.value = snareVolume;
      player.autostart = false;
      snarePlayer.current = player;
      console.log('Snare player initialized:', snarePlayer.current);
    }

    if (tomPlayer.current === null) {
      const player = new Tone.Player('/stomp.mp3').toDestination();
      player.volume.value = kickVolume;
      player.autostart = false;
      tomPlayer.current = player;
      console.log('Tom player initialized:', tomPlayer.current);
    }

    if (hatPlayer.current === null) {
      const player = new Tone.Player('/hat.mp3').toDestination();
      player.volume.value = hatVolume;
      player.autostart = false;
      hatPlayer.current = player;
      console.log('Hat player initialized:', hatPlayer.current);
    }

    const sequence = new Tone.Sequence((time, step) => {
      if (!mute.snare && stepData[step] !== 'empty') {
        playSound(snarePlayer.current, time, stepData[step] === 'heavy' ? snareVolume : snareVolume - 8);
      }
      if (!mute.tom && tomData[step] !== 'empty') {
        playSound(tomPlayer.current, time, tomData[step] === 'heavy' ? kickVolume : kickVolume - 8);
      }
      if (!mute.hat && hatData[step] !== 'empty') {
        playSound(hatPlayer.current, time, hatData[step] === 'heavy' ? hatVolume : hatVolume - 8);
      }
      setCurrentStep(step);
    }, Array.from({ length: steps }, (_, i) => i), '16n').start(0);

    Tone.Transport.bpm.value = bpm;

    return () => {
      sequence.dispose();
    };
  }, [stepData, tomData, hatData, bpm, snareVolume, kickVolume, hatVolume, mute]);

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
      } else if (event.key.toLowerCase() === 'j') {
        setVelocityToggle((prev) => (prev === 'heavy' ? 'light' : 'heavy'));
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
    const updateData = (data) => {
      const newData = data.map((s, stepIndex) => {
        if (stepIndex === step) {
          if (s === 'empty') return velocityToggle;
          else return 'empty';
        }
        return s;
      });
      return newData;
    };

    if (row === 'snare') {
      setStepData((prev) => updateData(prev));
    } else if (row === 'tom') {
      setTomData((prev) => updateData(prev));
    } else if (row === 'hat') {
      setHatData((prev) => updateData(prev));
    }
  };

  const playSound = (player, time, volume) => {
    console.log('Attempting to play sound at time', time);
    if (player) {
      console.log('Player loaded state:', player.loaded);
      if (player.loaded) {
        console.log('Playing sound');
        player.volume.value = volume;
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

  const sanitizeBpmInput = (input) => {
    // Remove any non-numeric characters
    let sanitizedInput = input.replace(/[^0-9]/g, ''); 
  
    // Ensure the sanitized input is within the valid range
    let parsedInput = parseInt(sanitizedInput, 10);
    if (isNaN(parsedInput) || parsedInput < 80) {
      parsedInput = 80;
    } else if (parsedInput > 200) {
      parsedInput = 200;
    }
  
    return parsedInput;
  };

  useEffect(() => {
    const constrainedBpm = constrainBpm(bpm);
    Tone.Transport.bpm.value = constrainedBpm;
    updateSliderColor(constrainedBpm); // Update slider color based on constrained BPM
  }, [bpm]);

  useEffect(() => {
    if (hatPlayer.current) {
      hatPlayer.current.volume.value = hatVolume;
    }
  }, [hatVolume]);

  useEffect(() => {
    if (snarePlayer.current) {
      snarePlayer.current.volume.value = snareVolume;
    }
  }, [snareVolume]);

  useEffect(() => {
    if (tomPlayer.current) {
      tomPlayer.current.volume.value = kickVolume;
    }
  }, [kickVolume]);

  const handleBpmChange = (event) => {
    const newBpm = parseInt(event.target.value);
    setBpm(constrainBpm(newBpm));
  };

  const handleBpmInputChange = (event) => {
    // Sanitize the input value immediately on change
    const sanitizedValue = event.target.value.replace(/[^0-9]/g, ''); 
    setBpm(sanitizedValue);
  };

  const handleBpmInputBlur = (event) => {
    const newBpm = sanitizeBpmInput(event.target.value);
    setBpm(newBpm);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      const newBpm = sanitizeBpmInput(event.target.value);
      setBpm(newBpm);
    }
  };

  const updateSliderColor = (value) => {
    const percentage = (value - 80) / (200 - 80);
    const red = Math.round(255 * percentage);
    const blue = 255 - red;
    const slider = document.getElementById('bpm');
    if (slider) {
      slider.style.background = `rgb(${red}, 0, ${blue})`;
    }
  };

  const toggleMute = (track) => {
    setMute((prev) => ({ ...prev, [track]: !prev[track] }));
  };

  const renderStepGroups = (data, row) => {
    const isMuted = mute[row];
    return (
      <div className="sequencer">
        {Array.from({ length: 4 }, (_, groupIndex) => (
          <div className="group" key={groupIndex}>
            {data.slice(groupIndex * 4, (groupIndex + 1) * 4).map((step, stepIndex) => {
              const globalIndex = groupIndex * 4 + stepIndex;
              let stepClass = step !== 'empty' ? step : '';
              if (isMuted) {
                if (stepClass === 'heavy') stepClass = 'light';
                else if (stepClass === 'light') stepClass = 'empty';
                else if (stepClass === 'empty') stepClass = 'muted-empty';
              }
              return (
                <div
                  key={globalIndex}
                  className={`step ${stepClass} ${currentStep === globalIndex ? 'current' : ''}`}
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

  const renderVolumeDials = () => {
    return (
      <div className="volume-container">
        <input
          type="range"
          min="-32"
          max="-12"
          value={hatVolume}
          onChange={(e) => setHatVolume(e.target.value)}
          className="volume-dial"
        />
        <input
          type="range"
          min="-32"
          max="-12"
          value={snareVolume}
          onChange={(e) => setSnareVolume(e.target.value)}
          className="volume-dial"
        />
        <input
          type="range"
          min="-32"
          max="-12"
          value={kickVolume}
          onChange={(e) => setKickVolume(e.target.value)}
          className="volume-dial"
        />
      </div>
    );
  };
  
  return (
    <div>
      <a href="https://yuv1.com/" target="_blank" rel="noopener noreferrer">
        <img src="/yuvdaw.png" alt="yuvdaw" className="custom-logo" />
      </a>
      <div className="main-container">
        <div className="label-container">
          <div className={`label ${mute.hat ? 'muted' : ''}`} onClick={() => toggleMute('hat')}>hat</div>
          <div className={`label ${mute.snare ? 'muted' : ''}`} onClick={() => toggleMute('snare')}>snare</div>
          <div className={`label ${mute.tom ? 'muted' : ''}`} onClick={() => toggleMute('tom')}>kick</div>
        </div>
        {renderVolumeDials()}
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
        <button onClick={() => { setStepData(Array(steps).fill('empty')); setTomData(Array(steps).fill('empty')); setHatData(Array(steps).fill('empty')); }}>clear</button>
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
          className="bpm-input"
        />
      </div>
      <div className="tap-bpm">
        <button onClick={resetTapBpm}>reset</button>
        <label>(tap k)</label>
        <span className="tap-value">{tapBpm !== null ? tapBpm : '???'}</span>
      </div>
      <div 
        className="velocity-toggle-indicator" 
        style={{ backgroundColor: velocityToggle === 'heavy' ? '#555' : '#aaa', width: '30px', height: '30px', margin: '10px auto', border: '1px solid #aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '8px' }}
      >
        toggle =j
      </div>
    </div>
  );
};

export default Sequencer;
