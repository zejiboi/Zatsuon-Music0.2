import { useState, useEffect } from 'react';
import { darkOrchestra, OrchestraState, OrchestraPreset, AmbientTrack } from './darkOrchestraEngine';

export const useDarkOrchestra = () => {
  const [state, setState] = useState<OrchestraState>(darkOrchestra.getState());

  useEffect(() => {
    const unsubscribe = darkOrchestra.subscribe(setState);
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    ...state,
    play: () => darkOrchestra.play(),
    pause: () => darkOrchestra.pause(),
    toggle: () => darkOrchestra.toggle(),
    setVolume: (v: number) => darkOrchestra.setVolume(v),
    setPreset: (p: OrchestraPreset) => darkOrchestra.setPreset(p),
    setSong: (track: AmbientTrack) => darkOrchestra.setSong(track),
    unlock: () => darkOrchestra.unlockContext(),
    getAnalyser: () => darkOrchestra.getAnalyser()
  };
};
