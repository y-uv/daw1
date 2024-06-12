import * as Tone from 'tone';

export const initializePlayers = (kit, voices, volumes) => {
  const players = {
    snare: Array.from({ length: voices }, () => new Tone.Player(kit.snare.file).toDestination()),
    tom: Array.from({ length: voices }, () => new Tone.Player(kit.tom.file).toDestination()),
    hat: Array.from({ length: voices }, () => new Tone.Player(kit.hat.file).toDestination()),
    fx: Array.from({ length: voices }, () => new Tone.Player(kit.fx.file).toDestination()),
  };

  Object.keys(players).forEach(track => {
    players[track].forEach(player => {
      player.volume.value = volumes[track];
      player.autostart = false;
    });
  });

  return players;
};

export const playSound = (players, time, volume) => {
  const player = players.find(player => !player.state || player.state === 'stopped');
  if (player && player.loaded) {
    player.volume.value = volume;
    player.start(time);
  }
};
