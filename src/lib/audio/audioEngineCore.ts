"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  attachFFmpegProgress,
  cleanupFFmpegFiles,
  createScopedFFmpeg,
  execFFmpeg,
} from "@/lib/ffmpeg";

interface PitchAudioElement extends HTMLAudioElement {
  webkitPreservesPitch?: boolean;
  mozPreservesPitch?: boolean;
}

/**
 * Generates a synthetic stereo reverb impulse response.
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

export interface OfflineAudioEffects {
  speed: number;
  bassGain: number;       // dB (lowshelf at 110Hz), 0 = no change
  trebleGain?: number;    // dB (highshelf at 3000Hz), 0 = no change
  lowpassFreq?: number;   // Hz (lowpass filter cutoff), 20000 = open
  reverbMix: number;      // 0-1, 0 = dry, 1 = full wet
  delayTime?: number;     // seconds (0 to 2)
  delayFeedback?: number; // 0 to 0.9
  delayMix?: number;      // 0-1
  preservePitch: boolean;
  gain: number;           // dB, master output gain (0 = unity)
}

/**
 * Renders the source AudioBuffer through the shared effect chain
 * (lowpass, bass, treble, delay, reverb, master gain) using OfflineAudioContext.
 */
export async function renderAudioOffline(
  sourceBuffer: AudioBuffer,
  fx: OfflineAudioEffects
): Promise<AudioBuffer> {
  const rate = sourceBuffer.sampleRate;
  const channels = sourceBuffer.numberOfChannels;
  const outputDuration = sourceBuffer.duration / fx.speed;
  const hasTailEffects = fx.reverbMix > 0 || (fx.delayMix ?? 0) > 0;
  const tailPad = hasTailEffects ? 3.0 : 0.25;
  const outputLen = Math.ceil((outputDuration + tailPad) * rate);

  const offline = new OfflineAudioContext(channels, outputLen, rate);

  const src = offline.createBufferSource();
  src.buffer = sourceBuffer;
  src.playbackRate.value = fx.speed;

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

  const fxSplit = offline.createGain();
  fxSplit.gain.value = 1;

  const convolver = offline.createConvolver();
  convolver.buffer = createReverbImpulse(offline);

  const delay = offline.createDelay(5.0);
  delay.delayTime.value = fx.delayTime ?? 0;

  const feedback = offline.createGain();
  feedback.gain.value = fx.delayFeedback ?? 0;
  delay.connect(feedback);
  feedback.connect(delay);

  const dry = offline.createGain();
  dry.gain.value = 1 - fx.reverbMix;

  const wet = offline.createGain();
  wet.gain.value = fx.reverbMix;

  const delayWet = offline.createGain();
  delayWet.gain.value = fx.delayMix ?? 0;

  const masterGain = offline.createGain();
  masterGain.gain.value = Math.pow(10, (fx.gain || 0) / 20);

  src.connect(lowpass);
  lowpass.connect(bass);
  bass.connect(treble);
  treble.connect(fxSplit);

  fxSplit.connect(dry);
  fxSplit.connect(convolver);
  convolver.connect(wet);
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
 * Encodes an AudioBuffer into a standard 16-bit PCM WAV file (Uint8Array).
 */
export function audioBufferToWav(buffer: AudioBuffer): Uint8Array {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
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

  writeStr(0, "RIFF");
  view.setUint32(4, totalSize - 8, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
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
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Uint8Array(out);
}

/**
 * Encodes an AudioBuffer into a 192kbps MP3 using a scoped in-browser FFmpeg worker,
 * cleaning up virtual files and terminating the worker in `finally`.
 */
export async function audioBufferToMp3(
  buffer: AudioBuffer,
  onProgress?: (p: number) => void
): Promise<Uint8Array> {
  const ffmpeg = await createScopedFFmpeg();
  const detachProgress = onProgress ? attachFFmpegProgress(ffmpeg, onProgress) : null;

  try {
    const wavData = audioBufferToWav(buffer);
    await ffmpeg.writeFile("input.wav", wavData);

    await execFFmpeg(
      ffmpeg,
      ["-i", "input.wav", "-c:a", "libmp3lame", "-b:a", "192k", "output.mp3"],
      "MP3 encoding"
    );

    const mp3Data = await ffmpeg.readFile("output.mp3");
    if (!(mp3Data instanceof Uint8Array)) {
      throw new Error("Unexpected MP3 output buffer");
    }
    return new Uint8Array(mp3Data);
  } finally {
    detachProgress?.();
    await cleanupFFmpegFiles(ffmpeg, ["input.wav", "output.mp3"]);
    try {
      ffmpeg.terminate();
    } catch {
      // Ignore worker termination failures
    }
  }
}

/**
 * Radix-2 Cooley-Tukey FFT operating in-place on real & imaginary buffers of power-of-2 size N.
 */
function fftInPlace(re: Float32Array, im: Float32Array, N: number): void {
  for (let i = 1, j = 0; i < N; i++) {
    let bit = N >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }

  for (let len = 2; len <= N; len <<= 1) {
    const half = len >> 1;
    const angle = (-2 * Math.PI) / len;
    const wRe = Math.cos(angle);
    const wIm = Math.sin(angle);
    for (let i = 0; i < N; i += len) {
      let curRe = 1;
      let curIm = 0;
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
 * Extracts byte-scaled frequency data (matching AnalyserNode.getByteFrequencyData)
 * from a decoded AudioBuffer at an arbitrary timestamp.
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

  const invCh = 1 / numCh;
  for (let i = 0; i < fftSize; i++) {
    const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (fftSize - 1)));
    re[i] *= invCh * hann;
  }

  fftInPlace(re, im, fftSize);

  const out = new Uint8Array(half);
  const minDb = -100;
  const maxDb = -30;
  const range = maxDb - minDb;

  for (let i = 0; i < half; i++) {
    const mag = Math.sqrt(re[i] * re[i] + im[i] * im[i]) / fftSize;
    const db = mag > 0 ? 20 * Math.log10(mag) : -200;
    const scaled = ((db - minDb) / range) * 255;
    out[i] = Math.max(0, Math.min(255, Math.round(scaled)));
  }

  return out;
}

/**
 * Shared live Web Audio playback & DSP hook used by Audio Effects Studio and Music Visualizer.
 */
export function useAudioEngineCore() {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const ctxRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<PitchAudioElement | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

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

  const outputRef = useRef<GainNode | null>(null);
  const streamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  const freqRef = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(0));
  const timeRef = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(0));

  const onEndedRef = useRef<(() => void) | null>(null);
  const pollRef = useRef(0);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(pollRef.current);
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.onended = null;
      audio.onloadedmetadata = null;
      audio.onerror = null;
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

  useEffect(() => cleanup, [cleanup]);

  const init = useCallback(
    async (file: File) => {
      cleanup();

      const ctx = new AudioContext();
      const audio: PitchAudioElement = new Audio();
      audio.crossOrigin = "anonymous";
      const objectUrl = URL.createObjectURL(file);
      audio.src = objectUrl;
      audio.preload = "auto";

      try {
        await new Promise<void>((res, rej) => {
          audio.onloadedmetadata = () => res();
          audio.onerror = () => rej(new Error("Failed to load audio file"));
        });
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        ctx.close().catch(() => {});
        throw err;
      }

      const dur = audio.duration;
      const source = ctx.createMediaElementSource(audio);

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.82;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 20000;

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
    cancelAnimationFrame(pollRef.current);
    if (ctx.state === "suspended") await ctx.resume();
    await audio.play();
    setIsPlaying(true);

    const poll = () => {
      if (audioRef.current === audio && !audio.paused) {
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
    if (!a) return;
    if ("preservesPitch" in a) a.preservesPitch = v;
    if ("webkitPreservesPitch" in a) a.webkitPreservesPitch = v;
    if ("mozPreservesPitch" in a) a.mozPreservesPitch = v;
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
