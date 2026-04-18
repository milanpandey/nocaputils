"use client";

import { useRef, useState, useCallback } from "react";

/**
 * Generates a synthetic reverb impulse response.
 * Longer duration + lower decay = more spacious reverb.
 */
function createReverbImpulse(
  ctx: AudioContext,
  duration = 2.5,
  decay = 3.5
): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * duration);
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

export function useAudioEngine() {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // ── Core refs ──
  const ctxRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // ── Effect-chain refs ──
  const bassRef = useRef<BiquadFilterNode | null>(null);
  const convolverRef = useRef<ConvolverNode | null>(null);
  const dryRef = useRef<GainNode | null>(null);
  const wetRef = useRef<GainNode | null>(null);
  const masterRef = useRef<GainNode | null>(null);

  // ── Output refs ──
  const outputRef = useRef<GainNode | null>(null); // speaker volume (mutable)
  const streamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // ── Data arrays ──
  const freqRef = useRef(new Uint8Array(0));
  const timeRef = useRef(new Uint8Array(0));

  // ── Callbacks ──
  const onEndedRef = useRef<(() => void) | null>(null);
  const pollRef = useRef(0);

  /* ------------------------------------------------------------------ */
  /*  cleanup                                                            */
  /* ------------------------------------------------------------------ */
  const cleanup = useCallback(() => {
    cancelAnimationFrame(pollRef.current);
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.onended = null;
      if (audio.src) URL.revokeObjectURL(audio.src);
    }
    ctxRef.current?.close().catch(() => {});

    ctxRef.current = null;
    audioRef.current = null;
    sourceRef.current = null;
    analyserRef.current = null;
    bassRef.current = null;
    convolverRef.current = null;
    dryRef.current = null;
    wetRef.current = null;
    masterRef.current = null;
    outputRef.current = null;
    streamDestRef.current = null;
    freqRef.current = new Uint8Array(0);
    timeRef.current = new Uint8Array(0);

    setIsReady(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  /* ------------------------------------------------------------------ */
  /*  init — build the entire audio graph from a File                    */
  /* ------------------------------------------------------------------ */
  const init = useCallback(
    async (file: File) => {
      cleanup();

      const ctx = new AudioContext();
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.src = URL.createObjectURL(file);
      audio.preload = "auto";

      await new Promise<void>((res, rej) => {
        audio.onloadedmetadata = () => res();
        audio.onerror = () => rej(new Error("Failed to load audio file"));
      });

      const dur = audio.duration;

      // ── Build node graph ──
      //
      //  source → bass → ┬ dryGain  ┬→ master → analyser → outputGain → speakers
      //                   └ convolver → wetGain ┘                     → streamDest
      //
      const source = ctx.createMediaElementSource(audio);

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.82;

      const bass = ctx.createBiquadFilter();
      bass.type = "lowshelf";
      bass.frequency.value = 110;
      bass.gain.value = 0;

      const convolver = ctx.createConvolver();
      convolver.buffer = createReverbImpulse(ctx);

      const dry = ctx.createGain();
      dry.gain.value = 1;
      const wet = ctx.createGain();
      wet.gain.value = 0;
      const master = ctx.createGain();
      master.gain.value = 1;
      const output = ctx.createGain();
      output.gain.value = 1;
      const streamDest = ctx.createMediaStreamDestination();

      source.connect(bass);
      bass.connect(dry);
      bass.connect(convolver);
      convolver.connect(wet);
      dry.connect(master);
      wet.connect(master);
      master.connect(analyser);
      analyser.connect(output);
      output.connect(ctx.destination); // speakers (mutable via output gain)
      analyser.connect(streamDest); // recording (always active)

      // ── Store refs ──
      ctxRef.current = ctx;
      audioRef.current = audio;
      sourceRef.current = source;
      analyserRef.current = analyser;
      bassRef.current = bass;
      convolverRef.current = convolver;
      dryRef.current = dry;
      wetRef.current = wet;
      masterRef.current = master;
      outputRef.current = output;
      streamDestRef.current = streamDest;
      freqRef.current = new Uint8Array(analyser.frequencyBinCount);
      timeRef.current = new Uint8Array(analyser.frequencyBinCount);

      // ── Events ──
      audio.onended = () => {
        cancelAnimationFrame(pollRef.current);
        setIsPlaying(false);
        onEndedRef.current?.();
      };

      setDuration(dur);
      setIsReady(true);
    },
    [cleanup]
  );

  /* ------------------------------------------------------------------ */
  /*  Transport                                                          */
  /* ------------------------------------------------------------------ */
  const play = useCallback(async () => {
    const ctx = ctxRef.current;
    const audio = audioRef.current;
    if (!ctx || !audio) return;
    if (ctx.state === "suspended") await ctx.resume();
    await audio.play();
    setIsPlaying(true);

    // Smooth time polling via rAF
    const poll = () => {
      if (audio && !audio.paused) {
        setCurrentTime(audio.currentTime);
        pollRef.current = requestAnimationFrame(poll);
      }
    };
    pollRef.current = requestAnimationFrame(poll);
  }, []);

  const pause = useCallback(() => {
    cancelAnimationFrame(pollRef.current);
    audioRef.current?.pause();
    setIsPlaying(false);
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  }, []);

  const seek = useCallback((t: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = t;
      setCurrentTime(t);
    }
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Effect controls                                                    */
  /* ------------------------------------------------------------------ */
  const setSpeed = useCallback((s: number) => {
    if (audioRef.current) audioRef.current.playbackRate = s;
  }, []);

  const setPreservePitch = useCallback((v: boolean) => {
    const a = audioRef.current;
    if (a && "preservesPitch" in a) (a as any).preservesPitch = v;
  }, []);

  const setBassGain = useCallback((g: number) => {
    if (bassRef.current) bassRef.current.gain.value = g;
  }, []);

  const setReverbMix = useCallback((m: number) => {
    if (dryRef.current) dryRef.current.gain.value = 1 - m;
    if (wetRef.current) wetRef.current.gain.value = m;
  }, []);

  const setMuted = useCallback((v: boolean) => {
    if (outputRef.current) outputRef.current.gain.value = v ? 0 : 1;
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Data getters                                                       */
  /* ------------------------------------------------------------------ */
  const getFrequencyData = useCallback((): Uint8Array => {
    analyserRef.current?.getByteFrequencyData(freqRef.current);
    return freqRef.current;
  }, []);

  const getTimeDomainData = useCallback((): Uint8Array => {
    analyserRef.current?.getByteTimeDomainData(timeRef.current);
    return timeRef.current;
  }, []);

  const getAudioStream = useCallback(
    () => streamDestRef.current?.stream ?? null,
    []
  );

  const setOnEnded = useCallback((fn: (() => void) | null) => {
    onEndedRef.current = fn;
  }, []);

  return {
    isReady,
    isPlaying,
    currentTime,
    duration,
    init,
    play,
    pause,
    seek,
    cleanup,
    setSpeed,
    setPreservePitch,
    setBassGain,
    setReverbMix,
    setMuted,
    getFrequencyData,
    getTimeDomainData,
    getAudioStream,
    setOnEnded,
  };
}
