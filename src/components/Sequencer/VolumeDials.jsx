import React from 'react';

const VolumeDials = ({ fxVolume, setFxVolume, hatVolume, setHatVolume, snareVolume, setSnareVolume, kickVolume, setKickVolume }) => {
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

export default VolumeDials;
