import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Drives step-by-step playback. `total` = number of steps. Index is clamped to
 * [0, total-1]. When `resetKey` changes, playback restarts from step 0.
 * Speed is a multiplier on the base interval (1× = 900 ms per step).
 */
export function usePlayback(total, { baseMs = 900, initialSpeed = 1, resetKey, autoPlay = false } = {}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(initialSpeed);
  const timer = useRef(null);

  useEffect(() => {
    setIndex(0);
    setPlaying(autoPlay && total > 1);
  }, [resetKey, total, autoPlay]);

  useEffect(() => {
    if (!playing) return undefined;
    if (index >= total - 1) {
      setPlaying(false);
      return undefined;
    }
    timer.current = setTimeout(() => setIndex((i) => Math.min(i + 1, total - 1)), baseMs / speed);
    return () => clearTimeout(timer.current);
  }, [playing, index, total, speed, baseMs]);

  const play = useCallback(() => {
    setIndex((i) => (i >= total - 1 ? 0 : i));
    setPlaying(true);
  }, [total]);
  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, play, pause]);
  const next = useCallback(() => { setPlaying(false); setIndex((i) => Math.min(i + 1, Math.max(0, total - 1))); }, [total]);
  const prev = useCallback(() => { setPlaying(false); setIndex((i) => Math.max(i - 1, 0)); }, []);
  const restart = useCallback(() => { setPlaying(false); setIndex(0); }, []);
  const end = useCallback(() => { setPlaying(false); setIndex(Math.max(0, total - 1)); }, [total]);
  const goTo = useCallback((i) => { setPlaying(false); setIndex(Math.max(0, Math.min(i, total - 1))); }, [total]);

  return { index, playing, speed, setSpeed, play, pause, toggle, next, prev, restart, end, goTo, total };
}
