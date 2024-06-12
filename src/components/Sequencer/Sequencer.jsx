import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import Track from './Track';
import Controls from './Controls';
import VolumeDials from './VolumeDials';
import Overlay from './Overlay';
import BPMControl from './BPMControl';
import { initializePlayers, playSound } from '../../utils/audioUtils';
import { constrainBpm, sanitizeBpmInput } from '../../utils/bpmUtils';
import { resetTapBpm, resetTapTimeout } from '../../utils/tapBpmUtils';
import useAudioContext from '../../hooks/useAudioContext';

const Sequencer = () => {
  const steps = 32;
  const voices = 4;
  const [stepData, setStepData] = useState(Array(steps).fill('empty'));
  const [tomData, setTomData] = useState(Array(steps).fill('empty'));
  const [hatData, setHatData] = useState(Array(steps).fill('empty'));
  const [fxData, setFxData] = useState(Array(steps).fill('empty'));
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);
  const [velocityToggle, setVelocityToggle] = useState('heavy');
  const [mute, setMute] = useState({ snare: false, tom: false, hat: false, fx: false });

  const [isDragging, setIsDragging] = useState(false);
  const [dragToggle, setDragToggle] = useState('empty');

  const [tapTimes, setTapTimes] = useState([]);
  const [tapBpm, setTapBpm] = useState(null);
  const tapTimeoutRef = useRef(null);

  const snarePlayers = useRef([]);
  const tomPlayers = useRef([]);
  const hatPlayers = useRef([]);
  const fxPlayers = useRef([]);

  const [hatVolume, setHatVolume] = useState(-22);
  const [snareVolume, setSnareVolume] = useState(-20);
  const [kickVolume, setKickVolume] = useState(-18);
  const [fxVolume, setFxVolume] = useState(-20);

  const [audioStarted, setAudioStarted] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  const silentAudioRef = useRef(null);

  const drumKits = [
    {
      name: "jersey",
      tracks: {
        snare: { label: "snap", file: "/snap.mp3" },
        tom: { label: "stomp", file: "/stomp.mp3" },
        hat: { label: "hat", file: "/hat.mp3" },
        fx: { label: "tri", file: "/fx.mp3" },
      },
    },
    {
      name: "glo",
      tracks: {
        snare: { label: "clapz", file: "/clapsnare.mp3" },
        tom: { label: "chant", file: "/chant.mp3" },
        hat: { label: "hit1", file: "/hit1.mp3" },
        fx: { label: "oh", file: "/oh.mp3" },
      },
    },
    {
      name: "tsk",
      tracks: {
        snare: { label: "snare", file: "/tsksnare.mp3" },
        tom: { label: "808", file: "/tsk808.mp3" },
        hat: { label: "hat", file: "/tskhat.mp3" },
        fx: { label: "boop", file: "/tskperc.mp3" },
      },
    },
    {
      name: "plugg",
      tracks: {
        snare: { label: "clap", file: "/pluggclap.mp3" },
        tom: { label: "snare", file: "/pluggsnare.mp3" },
        hat: { label: "hat", file: "/plugghat.mp3" },
        fx: { label: "crash", file: "/pluggcrash.mp3" },
      },
    },
  ];

  const [currentKit, setCurrentKit] = useState(0);

  useAudioContext();

  useEffect(() => {
    const kit = drumKits[currentKit].tracks;
    const volumes = { snare: snareVolume, tom: kickVolume, hat: hatVolume, fx: fxVolume };

    const players = initializePlayers(kit, voices, volumes);
    snarePlayers.current = players.snare;
    tomPlayers.current = players.tom;
    hatPlayers.current = players.hat;
    fxPlayers.current = players.fx;
  }, [currentKit, snareVolume, kickVolume, hatVolume, fxVolume]);

  useEffect(() => {
    const sequence = new Tone.Sequence((time, step) => {
      if (!mute.fx && fxData[step] !== 'empty') {
        playSound(fxPlayers.current, time, fxData[step] === 'heavy' ? fxVolume : fxVolume - 8);
      }
      if (!mute.snare && stepData[step] !== 'empty') {
        playSound(snarePlayers.current, time, stepData[step] === 'heavy' ? snareVolume : snareVolume - 8);
      }
      if (!mute.tom && tomData[step] !== 'empty') {
        playSound(tomPlayers.current, time, tomData[step] === 'heavy' ? kickVolume : kickVolume - 8);
      }
      if (!mute.hat && hatData[step] !== 'empty') {
        playSound(hatPlayers.current, time, hatData[step] === 'heavy' ? hatVolume : hatVolume - 8);
      }
      setCurrentStep(step);
    }, Array.from({ length: steps }, (_, i) => i), '16n').start(0);

    Tone.Transport.bpm.value = bpm;

    return () => {
      sequence.dispose();
    };
  }, [stepData, tomData, hatData, fxData, bpm, snareVolume, kickVolume, hatVolume, fxVolume, mute]);

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
      } else if (event.key.toLowerCase() === 'b') {
        toggleVelocity();
      }
    };

    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, []);

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    const handleTouchStart = () => {
      if (Tone.context.state !== 'running') {
        Tone.context.resume().then(() => {
          console.log('Audio context resumed from touch event');
        }).catch((error) => {
          console.error('Error resuming audio context from touch event:', error);
        });
      }
    };

    window.addEventListener('touchstart', handleTouchStart);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
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
    if (mute[row]) return;
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
    } else if (row === 'fx') {
      setFxData((prev) => updateData(prev));
    }
  };

  const playSound = (players, time, volume) => {
    const player = players.find(player => !player.state || player.state === 'stopped');
    if (player && player.loaded) {
      player.volume.value = volume;
      player.start(time);
    }
  };

  const startSequencer = () => {
    const silentAudio = silentAudioRef.current;
    if (silentAudio) {
      silentAudio.play().then(() => {
        console.log('Silent audio played');
        if (Tone.context.state !== 'running') {
          Tone.context.resume().then(() => {
            Tone.Transport.start();
            setAudioStarted(true);
            setShowOverlay(false); // Hide the overlay
          }).catch((error) => {
            console.error('Error resuming audio context:', error);
          });
        } else {
          Tone.Transport.start();
          setAudioStarted(true);
          setShowOverlay(false); // Hide the overlay
        }
      }).catch((error) => {
        console.error('Error playing silent audio:', error);
      });
    }
  };

  const stopSequencer = () => {
    Tone.Transport.stop();
    setCurrentStep(0);
  };

  const constrainBpm = (value) => {
    return Math.max(80, Math.min(200, value));
  };

  const sanitizeBpmInput = (input) => {
    let sanitizedInput = input.replace(/[^0-9]/g, '');
    let parsedInput = parseInt(sanitizedInput, 10);
    if (isNaN(parsedInput) || parsedInput < 80) {
      sanitizedInput = 80;
    } else if (parsedInput > 200) {
      sanitizedInput = 200;
    }
    return sanitizedInput;
  };

  useEffect(() => {
    const constrainedBpm = constrainBpm(bpm);
    Tone.Transport.bpm.value = constrainedBpm;
    updateSliderColor(constrainedBpm);
  }, [bpm]);

  useEffect(() => {
    snarePlayers.current.forEach(player => {
      player.volume.value = snareVolume;
    });
  }, [snareVolume]);

  useEffect(() => {
    tomPlayers.current.forEach(player => {
      player.volume.value = kickVolume;
    });
  }, [kickVolume]);

  useEffect(() => {
    hatPlayers.current.forEach(player => {
      player.volume.value = hatVolume;
    });
  }, [hatVolume]);

  useEffect(() => {
    fxPlayers.current.forEach(player => {
      player.volume.value = fxVolume;
    });
  }, [fxVolume]);

  const handleBpmChange = (event) => {
    const newBpm = parseInt(event.target.value);
    setBpm(constrainBpm(newBpm));
  };

  const handleBpmInputChange = (event) => {
    // Only allow numeric values and limit the length to 3 digits
    let sanitizedValue = event.target.value.replace(/[^0-9]/g, '');
    if (sanitizedValue.length > 3) {
      sanitizedValue = sanitizedValue.slice(0, 3);
    }
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

  const toggleVelocity = () => {
    setVelocityToggle((prev) => (prev === 'heavy' ? 'light' : 'heavy'));
  };

  const handleMouseDown = (step, row) => {
    if (mute[row]) return; // Prevent changes if the row is muted
    setIsDragging(true);
    const currentState = getStateForRow(row)[step];
    const newToggleState = currentState === 'empty' ? velocityToggle : 'empty';
    setDragToggle(newToggleState);
    toggleStepWithState(step, row, newToggleState);
  };

  const handleMouseEnter = (step, row) => {
    if (isDragging && !mute[row]) {
      toggleStepWithState(step, row, dragToggle);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getStateForRow = (row) => {
    switch (row) {
      case 'snare':
        return stepData;
      case 'tom':
        return tomData;
      case 'hat':
        return hatData;
      case 'fx':
        return fxData;
      default:
        return [];
    }
  };

  const toggleStepWithState = (step, row, newState) => {
    const updateData = (data) => {
      const newData = data.map((s, stepIndex) => {
        if (stepIndex === step) {
          return newState;
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
    } else if (row === 'fx') {
      setFxData((prev) => updateData(prev));
    }
  };

  const renderStepGroups = (data, row) => {
    const isMuted = mute[row];
    return (
      <div className="sequencer">
        {Array.from({ length: 8 }, (_, groupIndex) => ( // Updated to 8 groups
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

  const renderDotRow = () => {
    const groups = Array.from({ length: 8 }, (_, groupIndex) => ( // Updated to 8 groups
      <div className="dot-group" key={groupIndex}>
        {Array.from({ length: 4 }, (_, index) => {
          const globalIndex = groupIndex * 4 + index;
          const isRedDot = groupIndex % 2 === 0 && index === 0;
          return (
            <div key={globalIndex} className="dot-container">
              <div className={`dot ${currentStep === globalIndex ? 'current' : ''} ${isRedDot ? 'red' : ''}`}></div>
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
          value={fxVolume}
          onChange={(e) => setFxVolume(e.target.value)}
          className="volume-dial"
        />
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

  const previousKit = () => {
    setCurrentKit((prev) => (prev > 0 ? prev - 1 : drumKits.length - 1));
    triggerConfetti();
  };

  const nextKit = () => {
    setCurrentKit((prev) => (prev < drumKits.length - 1 ? prev + 1 : 0));
    triggerConfetti();
  };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  //origin: { y: 0.32, x: 0.104 }
  
  function triggerConfetti() {
    confetti({
      angle: randomInRange(55, 125),
      spread: randomInRange(80, 130),
      particleCount: randomInRange(50, 100),
      origin: { y: 0.32, x: 0.104 },
    });
  }

  return (
    <div>
      {showOverlay && (
        <div className="overlay" onClick={startSequencer}>
          <div className="overlay-content">
            <p>click/tap</p>
          </div>
        </div>
      )}
      <audio ref={silentAudioRef}>
        <source src="/silent.mp3" type="audio/mp3" />
      </audio>
      <a >
        <img src="/yuvdaw.png" alt="yuvdaw" className="custom-logo" />
        </a>
      <div className="main-container">
      <div className="bank-selector">
      <button onClick={previousKit}>{"<"}</button>
        <span className="kit-name">{drumKits[currentKit].name}</span>
      <button onClick={nextKit}>{">"}</button>
      </div>
        <div className="label-container">
          <div className={`label ${mute.fx ? 'muted' : ''}`} onClick={() => toggleMute('fx')}>
            {drumKits[currentKit].tracks.fx.label}
          </div>
          <div className={`label ${mute.hat ? 'muted' : ''}`} onClick={() => toggleMute('hat')}>
            {drumKits[currentKit].tracks.hat.label}
          </div>
          <div className={`label ${mute.snare ? 'muted' : ''}`} onClick={() => toggleMute('snare')}>
            {drumKits[currentKit].tracks.snare.label}
          </div>
          <div className={`label ${mute.tom ? 'muted' : ''}`} onClick={() => toggleMute('tom')}>
            {drumKits[currentKit].tracks.tom.label}
          </div>
        </div>
        {renderVolumeDials()}
        <div className="sequencer-container">
          {renderDotRow()}
          {renderStepGroups(fxData, 'fx')}
          {renderStepGroups(hatData, 'hat')}
          {renderStepGroups(stepData, 'snare')}
          {renderStepGroups(tomData, 'tom')}
        </div>
      </div>
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
  <div className="control-button" onClick={startSequencer} color='#283444'>
    <i className="fas fa-play"></i>
  </div>
  <div className="control-button" onClick={stopSequencer} color='#283444'>
    <i className="fas fa-stop"></i>
  </div>
  <button onClick={() => {
    setStepData(Array(steps).fill('empty'));
    setTomData(Array(steps).fill('empty'));
    setHatData(Array(steps).fill('empty'));
    setFxData(Array(steps).fill('empty'));
    setMute({ snare: false, tom: false, hat: false, fx: false });
  }}>clear all</button>
    <label>&nbsp;b toggles velocity</label>
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
          type="text"
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
        <button onClick={resetTapBpm}>reset tap</button>
        <label>(tap bpm w/ k)</label>
        <span className="tap-value">{tapBpm !== null ? tapBpm : '???'}</span>
      </div>
      {/*
      <div
        className="velocity-toggle-indicator"
        style={{ backgroundColor: velocityToggle === 'heavy' ? '#555' : '#aaa', width: '30px', height: '30px', margin: '10px auto', border: '1px solid #aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '8px' }}
        onClick={toggleVelocity}
      >
        toggle =j
      </div>
    */}
    </div>
  );
};

export default Sequencer;
