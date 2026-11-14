// Web Audio API synthesized sound effects - 100% client-side, zero external files

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(freq: number, type: OscillatorType = "sine", duration: number = 0.15, volume: number = 0.2): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Graceful fallback if audio is blocked
  }
}

export function playBeep(freq: number = 880, duration: number = 0.12): void {
  playTone(freq, "sine", duration, 0.25);
}

export function playClick(): void {
  playTone(600, "triangle", 0.04, 0.15);
}

let chimeTimers: ReturnType<typeof setTimeout>[] = [];

export function playSuccessChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  chimeTimers.forEach((timer) => clearTimeout(timer));
  chimeTimers = [];

  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  chimeTimers = notes.map((freq, idx) =>
    setTimeout(() => {
      playTone(freq, "sine", 0.25, 0.2);
    }, idx * 75)
  );
}

export function playErrorBuzz(): void {
  playTone(180, "sawtooth", 0.25, 0.3);
}

export function playGoCue(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(1046.5, "sine", 0.18, 0.35); // High clear C6
}
