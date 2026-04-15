"use client";

import { useCallback, useRef, useEffect } from "react";

/**
 * Sound Manager — audio cues for Co-Work Mode agent events.
 *
 * 3 sounds triggered by AG-UI events:
 * - delegation: soft chime when CEO delegates to a specialist
 * - brain_query: gentle pulse when the agent queries the brain
 * - completion: warm tone when the session completes
 *
 * Toggleable via localStorage key "studio-sound-enabled".
 * Defaults to OFF (browser autoplay policies).
 * Requires user interaction before enabling (click the sound toggle).
 *
 * Uses Web Audio API to generate tones programmatically (no audio files needed).
 */

type SoundType = "delegation" | "brain_query" | "completion";

const SOUND_CONFIGS: Record<SoundType, { frequency: number; duration: number; type: OscillatorType }> = {
  delegation: { frequency: 523.25, duration: 0.15, type: "sine" },     // C5, short chime
  brain_query: { frequency: 392, duration: 0.1, type: "triangle" },     // G4, gentle pulse
  completion: { frequency: 659.25, duration: 0.3, type: "sine" },      // E5, warm tone
};

export function useSoundManager(enabled: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Lazy-init AudioContext on first use (requires user gesture)
  const getContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playSound = useCallback((type: SoundType) => {
    if (!enabled) return;

    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    try {
      const ctx = getContext();
      const config = SOUND_CONFIGS[type];

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);

      // Fade in/out to avoid clicks
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + config.duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + config.duration + 0.01);
    } catch {
      // Audio failures are non-blocking
    }
  }, [enabled, getContext]);

  // Cleanup
  useEffect(() => {
    return () => {
      audioCtxRef.current?.close();
    };
  }, []);

  return { playSound };
}
