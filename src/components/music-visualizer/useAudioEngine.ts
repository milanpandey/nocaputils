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
   chain (speed, bass boost, reverb) using OfflineAudioContext.
   ------------------------------------------------------------------ */

export interface OfflineAudioEffects {
  speed: number;
  bassGain: number;       // dB (lowshelf at 110Hz), 0 = no change
  reverbMix: number;      // 0-1, 0 = dry, 1 = full wet
  preservePitch: boolean; // whether to attempt pitch preservation
  gain: number;           // dB, master output gain (0 = unity)
}

/**
 * Render the source AudioBuffer through the same effect chain as the
 * live engine, producing a processed AudioBuffer ready for export.
 *
 * Graph:  bufferSource → bass → ┬ dry  ┬→ destination
 *                                └ conv → wet ┘
 */
export async function renderAudioOffline(
  sourceBuffer: AudioBuffer,
  fx: OfflineAudioEffects,
): Promise<AudioBuffer> {
  const rate = sourceBuffer.sampleRate;
  const channels = sourceBuffer.numberOfChannels;
  // Output duration is adjusted by speed: slower = longer, faster = shorter
  const outputDuration = sourceBuffer.duration / fx.speed;
  const outputLen = Math.ceil(outputDuration * rate);

  const offline = new OfflineAudioContext(channels, outputLen, rate);

  // Source
  const src = offline.createBufferSource();
  src.buffer = sourceBuffer;
  src.playbackRate.value = fx.speed;

  // Bass (lowshelf filter, same params as live engine)
  const bass = offline.createBiquadFilter();
  bass.type = "lowshelf";
  bass.frequency.value = 110;
  bass.gain.value = fx.bassGain;

  // Reverb
  const convolver = offline.createConvolver();
  convolver.buffer = createReverbImpulse(offline);

  const dry = offline.createGain();
  dry.gain.value = 1 - fx.reverbMix;
  const wet = offline.createGain();
  wet.gain.value = fx.reverbMix;

  // Master gain (dB → linear)
  const masterGain = offline.createGain();
  masterGain.gain.value = Math.pow(10, (fx.gain || 0) / 20);

  // Wire graph
  src.connect(bass);
  bass.connect(dry);
  bass.connect(convolver);
  convolver.connect(wet);
  dry.connect(masterGain);
  wet.connect(masterGain);
  masterGain.connect(offline.destination);

  src.start(0);

  return offline.startRendering();
}

/**
 * Encode an AudioBuffer into a standard 16-bit PCM WAV file (Uint8Array).
 * This is a self-contained WAV writer — no external dependencies.
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

  // Helper to write strings
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
  view.setUint32(16, 16, true);            // sub-chunk size
  view.setUint16(20, 1, true);             // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true); // bits per sample

  // data sub-chunk
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  // Interleave channels and convert float [-1, 1] → int16
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

/* ------------------------------------------------------------------
   Offline FFT — extract frequency data from a decoded AudioBuffer
   at any timestamp, without real-time playback.
   ------------------------------------------------------------------ */

/**
 * Simple radix-2 FFT (Cooley-Tukey). Operates in-place on interleaved
 * [real, imag, real, imag, ...] arrays of length 2*N where N is a power of 2.
 */
function fftInPlace(re: Float32Array, im: Float32Array, N: number): void {
  // Bit-reversal permutation
  for (let i = 1, j = 0; i < N; i++) {
    let bit = N >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  // FFT butterfly
  for (let len = 2; len <= N; len <<= 1) {
    const half = len >> 1;
    const angle = (-2 * Math.PI) / len;
    const wRe = Math.cos(angle);
    const wIm = Math.sin(angle);
    for (let i = 0; i < N; i += len) {
      let curRe = 1, curIm = 0;
      for (let j = 0; j < half; j++) {
        const a = i + j;
        const b = a + half;
        const tRe = curRe * re[b] - curIm * im[b];
        const tIm = curRe * im[b] + curIm * re[b];
        re[b] = re[a] - tRe;
        im[b] = im[a] - tIm;
        re[a] += tRe;
        im[a] += tIm;
        const nextRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nextRe;
      }
    }
  }
}

/**
 * Extract byte-scaled frequency data (matching AnalyserNode.getByteFrequencyData)
 * from a decoded AudioBuffer at an arbitrary timestamp.
 *
 * @param buffer   – Decoded AudioBuffer (from decodeAudioData)
 * @param timeSec  – Timestamp in seconds
 * @param fftSize  – FFT size (must be power-of-2, default 2048 to match the live analyser)
 * @returns Uint8Array of length fftSize/2 with values 0-255
 */
export function getFrequencyDataAtTime(
  buffer: AudioBuffer,
  timeSec: number,
  fftSize = 2048
): Uint8Array {
  const sampleRate = buffer.sampleRate;
  const centerSample = Math.floor(timeSec * sampleRate);
  const half = fftSize >> 1;
  const startSample = Math.max(0, centerSample - half);

  // Mix all channels to mono & apply Hann window
  const re = new Float32Array(fftSize);
  const im = new Float32Array(fftSize);
  const numCh = buffer.numberOfChannels;

  for (let ch = 0; ch < numCh; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < fftSize; i++) {
      const idx = startSample + i;
      if (idx >= 0 && idx < data.length) {
        re[i] += data[idx];
      }
    }
  }

  // Average channels & apply Hann window
  const invCh = 1 / numCh;
  for (let i = 0; i < fftSize; i++) {
    const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (fftSize - 1)));
    re[i] *= invCh * hann;
  }

  fftInPlace(re, im, fftSize);

  // Convert to magnitude in dB, then scale to 0-255 (matching AnalyserNode)
  const out = new Uint8Array(half);
  const minDb = -100; // AnalyserNode default minDecibels
  const maxDb = -30;  // AnalyserNode default maxDecibels
  const range = maxDb - minDb;

  for (let i = 0; i < half; i++) {
    const mag = Math.sqrt(re[i] * re[i] + im[i] * im[i]) / fftSize;
    const db = mag > 0 ? 20 * Math.log10(mag) : -200;
    const scaled = ((db - minDb) / range) * 255;
    out[i] = Math.max(0, Math.min(255, Math.round(scaled)));
  }

  return out;
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

  const setMasterGain = useCallback((dB: number) => {
    if (masterRef.current) masterRef.current.gain.value = Math.pow(10, dB / 20);
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
    setMasterGain,
    setMuted,
    getFrequencyData,
    getTimeDomainData,
    getAudioStream,
    setOnEnded,
  };
}
