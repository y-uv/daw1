import { useEffect } from 'react';
import * as Tone from 'tone';

const useAudioContext = () => {
  useEffect(() => {
    const handleTouchStart = () => {
      if (Tone.context.state !== 'running') {
        Tone.context.resume().then(() => {
          console.log('Audio context resumed');
        }).catch((error) => {
          console.error('Error resuming audio context:', error);
        });
      }
    };

    window.addEventListener('touchstart', handleTouchStart);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);
};

export default useAudioContext;
