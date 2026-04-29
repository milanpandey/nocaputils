"use client";

import { useRef, useState, useCallback } from "react";

/**
 * Generates a synthetic reverb impulse response.
 * Longer duration + lower decay = more spacious reverb.
 */
function createReverbImpulse(
  ctx: BaseAudioContext,
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

/* ------------------------------------------------------------------
   Offline audio rendering — process audio through the full effect
   chain (speed, bass, treble, lowpass, delay, reverb) 
   using OfflineAudioContext.
   ------------------------------------------------------------------ */

export interface OfflineAudioEffects {
  speed: number;
  bassGain: number;       // dB (lowshelf at 110Hz), 0 = no change
  trebleGain: number;     // dB (highshelf at 3000Hz), 0 = no change
  lowpassFreq: number;    // Hz (lowpass filter cutoff), 20000 = open
  reverbMix: number;      // 0-1, 0 = dry, 1 = full wet
  delayTime: number;      // seconds (0 to 2)
  delayFeedback: number;  // 0 to 0.9
  delayMix: number;       // 0-1
  preservePitch: boolean; // whether to attempt pitch preservation
  gain: number;           // dB, master output gain (0 = unity)
}

/**
 * Render the source AudioBuffer through the effect chain.
 */
export async function renderAudioOffline(
  sourceBuffer: AudioBuffer,
  fx: OfflineAudioEffects,
): Promise<AudioBuffer> {
  const rate = sourceBuffer.sampleRate;
  const channels = sourceBuffer.numberOfChannels;
  const outputDuration = sourceBuffer.duration / fx.speed;
  // Pad with a few seconds to let reverb and delay tail off
  const outputLen = Math.ceil((outputDuration + 3.0) * rate);

  const offline = new OfflineAudioContext(channels, outputLen, rate);

  // Source
  const src = offline.createBufferSource();
  src.buffer = sourceBuffer;
  src.playbackRate.value = fx.speed;

  // Filters
  const lowpass = offline.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = fx.lowpassFreq ?? 20000;

  const bass = offline.createBiquadFilter();
  bass.type = "lowshelf";
  bass.frequency.value = 110;
  bass.gain.value = fx.bassGain;

  const treble = offline.createBiquadFilter();
  treble.type = "highshelf";
  treble.frequency.value = 3000;
  treble.gain.value = fx.trebleGain ?? 0;

  // Splitter node to send to parallel effects
  const fxSplit = offline.createGain();
  fxSplit.gain.value = 1;

  // Reverb
  const convolver = offline.createConvolver();
  convolver.buffer = createReverbImpulse(offline);

  // Delay
  const delay = offline.createDelay(5.0);
  delay.delayTime.value = fx.delayTime ?? 0;
  
  const feedback = offline.createGain();
  feedback.gain.value = fx.delayFeedback ?? 0;

  // Delay feedback loop
  delay.connect(feedback);
  feedback.connect(delay);

  // Wet/Dry mix
  const dry = offline.createGain();
  dry.gain.value = 1 - fx.reverbMix;
  
  const wet = offline.createGain();
  wet.gain.value = fx.reverbMix;

  const delayWet = offline.createGain();
  delayWet.gain.value = fx.delayMix ?? 0;

  // Master gain (dB → linear)
  const masterGain = offline.createGain();
  masterGain.gain.value = Math.pow(10, (fx.gain || 0) / 20);

  // Wire graph
  src.connect(lowpass);
  lowpass.connect(bass);
  bass.connect(treble);
  treble.connect(fxSplit);

  // Dry path
  fxSplit.connect(dry);
  // Reverb path
  fxSplit.connect(convolver);
  convolver.connect(wet);
  // Delay path
  fxSplit.connect(delay);
  delay.connect(delayWet);

  dry.connect(masterGain);
  wet.connect(masterGain);
  delayWet.connect(masterGain);
  
  masterGain.connect(offline.destination);

  src.start(0);

  return offline.startRendering();
}

/**
 * Encode an AudioBuffer into a standard 16-bit PCM WAV file (Uint8Array).
 */
export function audioBufferToWav(buffer: AudioBuffer): Uint8Array {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const out = new ArrayBuffer(totalSize);
  const view = new DataView(out);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF header
  writeStr(0, "RIFF");
  view.setUint32(4, totalSize - 8, true);
  writeStr(8, "WAVE");

  // fmt sub-chunk
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);

  // data sub-chunk
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  let offset = headerSize;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Uint8Array(out);
}

export function useAudioEffectsEngine() {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Core refs
  const ctxRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Effect-chain refs
  const lowpassRef = useRef<BiquadFilterNode | null>(null);
  const bassRef = useRef<BiquadFilterNode | null>(null);
  const trebleRef = useRef<BiquadFilterNode | null>(null);
  const convolverRef = useRef<ConvolverNode | null>(null);
  const delayRef = useRef<DelayNode | null>(null);
  const feedbackRef = useRef<GainNode | null>(null);
  const delayWetRef = useRef<GainNode | null>(null);
  
  const dryRef = useRef<GainNode | null>(null);
  const wetRef = useRef<GainNode | null>(null);
  const masterRef = useRef<GainNode | null>(null);

  // Output refs
  const outputRef = useRef<GainNode | null>(null); // speaker volume
  const streamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // Data arrays for visualization
  const freqRef = useRef(new Uint8Array(0));
  const timeRef = useRef(new Uint8Array(0));

  const onEndedRef = useRef<(() => void) | null>(null);
  const pollRef = useRef(0);

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
    lowpassRef.current = null;
    bassRef.current = null;
    trebleRef.current = null;
    convolverRef.current = null;
    delayRef.current = null;
    feedbackRef.current = null;
    delayWetRef.current = null;
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

      // Build node graph
      const source = ctx.createMediaElementSource(audio);

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.82;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 20000; // Open by default

      const bass = ctx.createBiquadFilter();
      bass.type = "lowshelf";
      bass.frequency.value = 110;
      bass.gain.value = 0;

      const treble = ctx.createBiquadFilter();
      treble.type = "highshelf";
      treble.frequency.value = 3000;
      treble.gain.value = 0;

      const fxSplit = ctx.createGain();
      fxSplit.gain.value = 1;

      const convolver = ctx.createConvolver();
      convolver.buffer = createReverbImpulse(ctx);

      const delay = ctx.createDelay(5.0);
      delay.delayTime.value = 0;

      const feedback = ctx.createGain();
      feedback.gain.value = 0;

      // Wire feedback
      delay.connect(feedback);
      feedback.connect(delay);

      const delayWet = ctx.createGain();
      delayWet.gain.value = 0;

      const dry = ctx.createGain();
      dry.gain.value = 1;
      const wet = ctx.createGain();
      wet.gain.value = 0;
      
      const master = ctx.createGain();
      master.gain.value = 1;
      const output = ctx.createGain();
      output.gain.value = 1;
      const streamDest = ctx.createMediaStreamDestination();

      source.connect(lowpass);
      lowpass.connect(bass);
      bass.connect(treble);
      treble.connect(fxSplit);

      fxSplit.connect(dry);
      
      fxSplit.connect(convolver);
      convolver.connect(wet);

      fxSplit.connect(delay);
      delay.connect(delayWet);

      dry.connect(master);
      wet.connect(master);
      delayWet.connect(master);

      master.connect(analyser);
      analyser.connect(output);
      output.connect(ctx.destination);
      analyser.connect(streamDest);

      // Store refs
      ctxRef.current = ctx;
      audioRef.current = audio;
      sourceRef.current = source;
      analyserRef.current = analyser;
      lowpassRef.current = lowpass;
      bassRef.current = bass;
      trebleRef.current = treble;
      convolverRef.current = convolver;
      delayRef.current = delay;
      feedbackRef.current = feedback;
      delayWetRef.current = delayWet;
      dryRef.current = dry;
      wetRef.current = wet;
      masterRef.current = master;
      outputRef.current = output;
      streamDestRef.current = streamDest;
      freqRef.current = new Uint8Array(analyser.frequencyBinCount);
      timeRef.current = new Uint8Array(analyser.frequencyBinCount);

      // Events
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

  const play = useCallback(async () => {
    const ctx = ctxRef.current;
    const audio = audioRef.current;
    if (!ctx || !audio) return;
    if (ctx.state === "suspended") await ctx.resume();
    await audio.play();
    setIsPlaying(true);

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

  const setTrebleGain = useCallback((g: number) => {
    if (trebleRef.current) trebleRef.current.gain.value = g;
  }, []);

  const setLowpassFreq = useCallback((f: number) => {
    if (lowpassRef.current) lowpassRef.current.frequency.value = f;
  }, []);

  const setReverbMix = useCallback((m: number) => {
    if (dryRef.current) dryRef.current.gain.value = 1 - m;
    if (wetRef.current) wetRef.current.gain.value = m;
  }, []);

  const setDelay = useCallback((time: number, feedback: number, mix: number) => {
    if (delayRef.current) delayRef.current.delayTime.value = time;
    if (feedbackRef.current) feedbackRef.current.gain.value = feedback;
    if (delayWetRef.current) delayWetRef.current.gain.value = mix;
  }, []);

  const setMasterGain = useCallback((dB: number) => {
    if (masterRef.current) masterRef.current.gain.value = Math.pow(10, dB / 20);
  }, []);

  const setMuted = useCallback((v: boolean) => {
    if (outputRef.current) outputRef.current.gain.value = v ? 0 : 1;
  }, []);

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
    setTrebleGain,
    setLowpassFreq,
    setReverbMix,
    setDelay,
    setMasterGain,
    setMuted,
    getFrequencyData,
    getTimeDomainData,
    getAudioStream,
    setOnEnded,
  };
}
