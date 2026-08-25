"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";

type RecordingState = "idle" | "recording" | "paused" | "stopped";

export default function ScreenRecorderClient() {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Options
  const [includeWebcam, setIncludeWebcam] = useState(false);
  const [includeMic, setIncludeMic] = useState(true);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const livePreviewRef = useRef<HTMLVideoElement>(null);
  const pipWindowRef = useRef<Window | null>(null);
  const pipTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pipSupported, setPipSupported] = useState(false);
  const [pipOpen, setPipOpen] = useState(false);

  // Check Document PiP support on mount
  useEffect(() => {
    setPipSupported("documentPictureInPicture" in window);
  }, []);

  // Keyboard shortcuts: Space = pause/resume, Escape = stop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (recordingState === "recording" && e.code === "Space") {
        e.preventDefault();
        pauseRecording();
      } else if (recordingState === "paused" && e.code === "Space") {
        e.preventDefault();
        resumeRecording();
      } else if ((recordingState === "recording" || recordingState === "paused") && e.code === "Escape") {
        e.preventDefault();
        stopRecording();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingState]);

  // Cleanup streams on unmount
  useEffect(() => {
    return () => {
      stopAllStreams();
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      if (pipWindowRef.current) pipWindowRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopAllStreams = () => {
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    webcamStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    webcamStreamRef.current = null;
    closePipWindow();
  };

  const closePipWindow = () => {
    if (pipTimerRef.current) {
      clearInterval(pipTimerRef.current);
      pipTimerRef.current = null;
    }
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      pipWindowRef.current.close();
    }
    pipWindowRef.current = null;
    setPipOpen(false);
  };

  // Open Document Picture-in-Picture floating controls
  const openPipControls = useCallback(async () => {
    if (!("documentPictureInPicture" in window)) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pipWin = await (window as any).documentPictureInPicture.requestWindow({
        width: 340,
        height: 100,
      });

      pipWindowRef.current = pipWin;
      setPipOpen(true);

      // Build the floating controls UI
      const doc = pipWin.document;
      doc.title = "nocaputils — Recording";

      // Inject styles
      const style = doc.createElement("style");
      style.textContent = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #111;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          padding: 8px 12px;
          user-select: none;
          -webkit-app-region: drag;
        }
        .controls {
          display: flex;
          align-items: center;
          gap: 10px;
          -webkit-app-region: no-drag;
        }
        .rec-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #E63946;
          animation: pulse 1.2s ease-in-out infinite;
        }
        .rec-dot.paused { background: #F77F00; animation: none; }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        .timer {
          font-size: 20px;
          font-weight: 900;
          font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
          letter-spacing: 0.08em;
          min-width: 60px;
        }
        .status {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          opacity: 0.5;
          margin-right: 4px;
        }
        button {
          border: none;
          cursor: pointer;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
          padding: 6px 14px;
          color: #fff;
          border-radius: 3px;
          transition: background 0.15s;
        }
        .btn-pause { background: #F77F00; }
        .btn-pause:hover { background: #E76F51; }
        .btn-resume { background: #2A9D8F; }
        .btn-resume:hover { background: #238577; }
        .btn-stop { background: #E63946; }
        .btn-stop:hover { background: #c62f3b; }
      `;
      doc.head.appendChild(style);

      // Build HTML
      const container = doc.createElement("div");
      container.className = "controls";
      container.innerHTML = `
        <span class="rec-dot" id="pip-dot"></span>
        <span class="timer" id="pip-timer">00:00</span>
        <span class="status" id="pip-status">REC</span>
        <button class="btn-pause" id="pip-pause">⏸ Pause</button>
        <button class="btn-stop" id="pip-stop">⏹ Stop</button>
      `;
      doc.body.appendChild(container);

      // Wire up button handlers (they call back into our React component)
      const pauseBtn = doc.getElementById("pip-pause")!;
      const stopBtn = doc.getElementById("pip-stop")!;

      let isPaused = false;

      pauseBtn.addEventListener("click", () => {
        if (!isPaused) {
          // Pause
          if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.pause();
            setRecordingState("paused");
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
          }
          isPaused = true;
          pauseBtn.textContent = "▶ Resume";
          pauseBtn.className = "btn-resume";
          const dot = doc.getElementById("pip-dot");
          if (dot) dot.className = "rec-dot paused";
          const status = doc.getElementById("pip-status");
          if (status) status.textContent = "PAUSED";
        } else {
          // Resume
          if (mediaRecorderRef.current?.state === "paused") {
            mediaRecorderRef.current.resume();
            setRecordingState("recording");
            timerRef.current = setInterval(() => {
              setElapsed(prev => prev + 1);
            }, 1000);
          }
          isPaused = false;
          pauseBtn.textContent = "⏸ Pause";
          pauseBtn.className = "btn-pause";
          const dot = doc.getElementById("pip-dot");
          if (dot) dot.className = "rec-dot";
          const status = doc.getElementById("pip-status");
          if (status) status.textContent = "REC";
        }
      });

      stopBtn.addEventListener("click", () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
        closePipWindow();
      });

      // Sync timer to PiP window
      let pipElapsed = elapsed;
      pipTimerRef.current = setInterval(() => {
        if (!isPaused) {
          pipElapsed++;
        }
        const timerEl = doc.getElementById("pip-timer");
        if (timerEl) {
          const m = Math.floor(pipElapsed / 60).toString().padStart(2, "0");
          const s = (pipElapsed % 60).toString().padStart(2, "0");
          timerEl.textContent = `${m}:${s}`;
        }
      }, 1000);

      // Handle PiP window being closed by the user
      pipWin.addEventListener("pagehide", () => {
        setPipOpen(false);
        pipWindowRef.current = null;
        if (pipTimerRef.current) {
          clearInterval(pipTimerRef.current);
          pipTimerRef.current = null;
        }
      });

    } catch (err) {
      console.warn("Document PiP not available:", err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startRecording = useCallback(async () => {
    setError(null);
    setRecordedBlob(null);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }

    try {
      // Request screen capture
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true, // system audio if available
      });
      screenStreamRef.current = screenStream;

      // Combined tracks
      const combinedTracks: MediaStreamTrack[] = [...screenStream.getVideoTracks()];

      // Optional webcam
      if (includeWebcam) {
        try {
          const webcamStream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
          webcamStreamRef.current = webcamStream;
          if (webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = webcamStream;
            webcamVideoRef.current.play().catch(() => {});
          }
        } catch {
          console.warn("Webcam not available, continuing without it.");
        }
      }

      // Optional microphone
      if (includeMic) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStream.getAudioTracks().forEach(t => combinedTracks.push(t));
        } catch {
          console.warn("Microphone not available, continuing without it.");
        }
      }

      // Add system audio tracks from screen capture
      screenStream.getAudioTracks().forEach(t => combinedTracks.push(t));

      const combinedStream = new MediaStream(combinedTracks);

      // Show live preview
      if (livePreviewRef.current) {
        livePreviewRef.current.srcObject = combinedStream;
        livePreviewRef.current.play().catch(() => {});
      }

      // Determine best codec
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
          ? "video/webm;codecs=vp8,opus"
          : "video/webm";

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        setRecordingState("stopped");

        stopAllStreams();
        closePipWindow();
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      // Handle user stopping screen share via browser UI
      screenStream.getVideoTracks()[0].addEventListener("ended", () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
      });

      recorder.start(1000); // collect data every second
      setRecordingState("recording");
      setElapsed(0);

      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);

      // Auto-open floating PiP controls if supported
      if ("documentPictureInPicture" in window) {
        // Small delay to let the recording state settle
        setTimeout(() => openPipControls(), 500);
      }

    } catch (err: unknown) {
      console.error("Recording error:", err);
      if ((err as DOMException)?.name === "NotAllowedError") {
        setError("Screen recording permission was denied. Please allow screen sharing to record.");
      } else {
        setError("Failed to start recording. Your browser may not support screen capture.");
      }
      stopAllStreams();
    }
  }, [includeWebcam, includeMic, recordedUrl]);

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const downloadRecording = () => {
    if (!recordedBlob || !recordedUrl) return;
    const link = document.createElement("a");
    link.href = recordedUrl;
    link.download = `screen_recording_${Date.now()}.webm`;
    link.click();
  };

  const resetAll = () => {
    stopAllStreams();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);

    setRecordingState("idle");
    setRecordedBlob(null);
    setRecordedUrl(null);
    setError(null);
    setElapsed(0);
  };

  const fileSizeMB = recordedBlob ? (recordedBlob.size / (1024 * 1024)).toFixed(2) : null;

  return (
    <div className="subtle-pattern min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-10 pt-8 md:px-10 md:pt-12">
        <div className="mb-8 flex items-center justify-between">
          <a href="/creator-tools" className="bauhaus-back-link" aria-label="Return to Creator Tools Hub">
            <span aria-hidden="true">←</span> Creator Tools
          </a>
          <ThemeToggle />
        </div>

        <main className="flex flex-1 flex-col items-center" id="main-content">
          {/* Hero */}
          <div className="mb-10 text-center max-w-3xl">
            <div className="inline-block border-4 border-black bg-[#6A4C93] px-4 py-1 text-white text-sm font-black uppercase shadow-[4px_4px_0_0_#000] mb-4">
              Zero Upload · No Watermark · No Time Limit
            </div>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight leading-none text-[var(--text-main)] mb-4">
              Screen Recorder
            </h1>
            <p className="text-lg font-bold text-[var(--text-soft)]">
              Record your screen, application window, or browser tab with optional webcam overlay and microphone.
              100% private, zero server uploads, no watermarks, no time limits.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {["No Watermark", "No Time Limit", "100% Private", "Free Forever"].map(label => (
                <div key={label} className="neo-panel bg-[var(--bg-panel)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em]">
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Controls Panel */}
          <div className="w-full max-w-4xl neo-panel bg-[var(--bg-panel)] p-8 sm:p-10 mb-8">
            {/* Options (only visible when idle) */}
            {recordingState === "idle" && (
              <div className="border-4 border-black bg-[var(--bg-page)] p-6 mb-6">
                <h3 className="text-sm font-black uppercase text-[var(--text-main)] tracking-wider mb-4">
                  Recording Options
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <label htmlFor="include-webcam" className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      id="include-webcam"
                      checked={includeWebcam}
                      onChange={(e) => setIncludeWebcam(e.target.checked)}
                      className="w-5 h-5 accent-[#6A4C93] border-2 border-black"
                    />
                    <span className="text-sm font-black uppercase text-[var(--text-main)]">
                      🎥 Include Webcam Overlay
                    </span>
                  </label>

                  <label htmlFor="include-mic" className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      id="include-mic"
                      checked={includeMic}
                      onChange={(e) => setIncludeMic(e.target.checked)}
                      className="w-5 h-5 accent-[#6A4C93] border-2 border-black"
                    />
                    <span className="text-sm font-black uppercase text-[var(--text-main)]">
                      🎙️ Include Microphone Audio
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Start / Control Buttons */}
            <div className="flex flex-col items-center gap-4">
              {recordingState === "idle" && (
                <button
                  onClick={startRecording}
                  className="neo-button bg-[#E63946] text-white font-black uppercase px-12 py-5 text-xl flex items-center gap-3 w-full sm:w-auto justify-center"
                >
                  <span className="relative flex h-4 w-4" aria-hidden="true">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
                  </span>
                  Start Recording
                </button>
              )}

              {(recordingState === "recording" || recordingState === "paused") && (
                <div className="flex flex-col items-center gap-4 w-full">
                  {/* Timer Display */}
                  <div className="border-4 border-black bg-black text-white px-8 py-4 text-center">
                    <div className="flex items-center gap-3 justify-center">
                      {recordingState === "recording" && (
                        <span className="relative flex h-3 w-3" aria-hidden="true">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E63946] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E63946]"></span>
                        </span>
                      )}
                      <span className="text-4xl font-black tracking-[0.1em] font-mono">
                        {formatTime(elapsed)}
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] mt-1 block opacity-70">
                      {recordingState === "recording" ? "Recording" : "Paused"}
                    </span>
                  </div>

                  {/* Live preview */}
                  <div className="relative w-full max-w-2xl border-4 border-black bg-black overflow-hidden">
                    <video
                      ref={livePreviewRef}
                      muted
                      playsInline
                      className="w-full"
                      style={{ maxHeight: "360px", objectFit: "contain" }}
                    />
                    {/* Webcam PiP overlay */}
                    {includeWebcam && (
                      <div className="absolute bottom-3 right-3 w-32 h-24 border-3 border-white overflow-hidden rounded-sm shadow-lg">
                        <video
                          ref={webcamVideoRef}
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {/* Control Buttons */}
                  <div className="flex gap-3 flex-wrap justify-center">
                    {recordingState === "recording" ? (
                      <button
                        onClick={pauseRecording}
                        className="neo-button bg-[#F77F00] text-white font-black uppercase px-8 py-3 text-sm"
                      >
                        ⏸ Pause
                      </button>
                    ) : (
                      <button
                        onClick={resumeRecording}
                        className="neo-button bg-[#2A9D8F] text-white font-black uppercase px-8 py-3 text-sm"
                      >
                        ▶ Resume
                      </button>
                    )}
                    <button
                      onClick={stopRecording}
                      className="neo-button bg-[#E63946] text-white font-black uppercase px-8 py-3 text-sm"
                    >
                      ⏹ Stop Recording
                    </button>
                  </div>
                </div>
              )}

              {recordingState === "stopped" && recordedUrl && (
                <div className="w-full flex flex-col items-center gap-6">
                  <div className="border-4 border-black bg-[#2A9D8F] text-white p-4 w-full text-center">
                    <span className="text-3xl block mb-2" aria-hidden="true">🎉</span>
                    <h3 className="text-xl font-black uppercase tracking-tight">
                      Recording Complete!
                    </h3>
                    <p className="text-sm font-bold uppercase tracking-wider mt-1">
                      Duration: {formatTime(elapsed)} · Size: {fileSizeMB} MB
                    </p>
                  </div>

                  {/* Preview Player */}
                  <div className="w-full max-w-2xl border-4 border-black bg-black overflow-hidden">
                    <video
                      ref={previewVideoRef}
                      src={recordedUrl}
                      controls
                      playsInline
                      className="w-full"
                      style={{ maxHeight: "400px" }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 flex-wrap justify-center">
                    <button
                      onClick={downloadRecording}
                      className="neo-button bg-[#2A9D8F] text-white font-black uppercase px-10 py-4 text-lg flex items-center gap-2"
                    >
                      📥 Download Recording (.webm)
                    </button>
                    <button
                      onClick={resetAll}
                      className="neo-button bg-[#457B9D] text-white font-black uppercase px-8 py-4 text-sm"
                    >
                      🔄 Record Another
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-6 border-4 border-black bg-[#E63946] text-white p-4 font-bold text-sm" role="alert">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* How It Works + FAQ */}
          <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="neo-panel bg-[var(--bg-panel)] p-8">
              <h2 className="text-2xl font-black uppercase tracking-[-0.05em] mb-4">
                How It Works
              </h2>
              <div className="space-y-4 text-sm leading-7 text-[var(--text-soft)]">
                <p>
                  <span className="font-black text-[var(--text-main)]">nocaputils</span> uses the
                  browser&apos;s native <strong>Screen Capture API</strong> to record your screen directly —
                  no downloads, plugins, or extensions needed.
                </p>
                <p>
                  Your recording never leaves your device. The video data is captured and stored entirely
                  in browser memory until you choose to download it.
                </p>
                <p>
                  Enable the webcam overlay to add a picture-in-picture camera feed, perfect for
                  tutorials, demos, and walkthroughs.
                </p>
              </div>
            </div>

            <div className="neo-panel bg-[var(--bg-panel)] p-8">
              <h2 className="text-2xl font-black uppercase tracking-[-0.05em] mb-4">
                FAQ
              </h2>
              <div className="space-y-4 text-sm leading-7 text-[var(--text-soft)]">
                <div>
                  <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                    What format is the recording?
                  </p>
                  <p className="mt-1">
                    Recordings are saved as <strong>.webm</strong> (VP9/VP8 codec), which plays in all
                    modern browsers and media players like VLC.
                  </p>
                </div>
                <div>
                  <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                    Is there a time limit?
                  </p>
                  <p className="mt-1">
                    No! Record as long as you need. The only limit is your device&apos;s available memory.
                  </p>
                </div>
                <div>
                  <p className="font-black uppercase tracking-[0.14em] text-[var(--text-main)]">
                    Will it add a watermark?
                  </p>
                  <p className="mt-1">
                    Never. Your recording is clean and completely yours — no branding, no ads.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Browser Support Note */}
          <div className="w-full max-w-4xl neo-panel bg-[var(--bg-panel)] p-6 mb-8">
            <h3 className="text-sm font-black uppercase text-[var(--text-main)] tracking-wider mb-3">
              🌐 Browser Compatibility
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-[var(--text-soft)]">
              <div className="border-2 border-[var(--border-main)] bg-[var(--bg-page)] p-3">
                <span className="font-black text-[var(--text-main)] uppercase block mb-1">Screen Recording</span>
                <span className="text-[#2A9D8F] font-black">✓</span> Chrome 72+ &nbsp;
                <span className="text-[#2A9D8F] font-black">✓</span> Edge 79+ &nbsp;
                <span className="text-[#2A9D8F] font-black">✓</span> Firefox 66+ &nbsp;
                <span className="text-[#F77F00] font-black">✗</span> Safari (not supported)
              </div>
              <div className="border-2 border-[var(--border-main)] bg-[var(--bg-page)] p-3">
                <span className="font-black text-[var(--text-main)] uppercase block mb-1">Floating PiP Controls</span>
                <span className="text-[#2A9D8F] font-black">✓</span> Chrome 116+ &nbsp;
                <span className="text-[#2A9D8F] font-black">✓</span> Edge 116+ &nbsp;
                <span className="text-[#F77F00] font-black">✗</span> Firefox &nbsp;
                <span className="text-[#F77F00] font-black">✗</span> Safari
              </div>
            </div>
            <p className="text-[10px] font-bold text-[var(--text-soft)] uppercase tracking-wider mt-3">
              Floating controls use the Document Picture-in-Picture API to stay visible across all tabs. On unsupported browsers, a fixed control bar appears on this page instead.
            </p>
          </div>

          <div className="w-full max-w-4xl neo-panel bg-[var(--bg-panel-muted)] p-6 text-center text-xs font-bold uppercase tracking-wider text-[var(--text-soft)] mb-12">
            🔒 <strong>Enterprise Security &amp; Privacy:</strong> Screen recording uses browser-native APIs. Zero data is uploaded to any server. Your recordings stay on your device.
          </div>
        </main>

        <Footer />
      </div>

      {/* ── Floating Controls Bar (fallback when PiP not open) ── */}
      {(recordingState === "recording" || recordingState === "paused") && !pipOpen && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[9999] flex items-center justify-center gap-3 px-4 py-3"
          style={{
            background: "rgba(0, 0, 0, 0.92)",
            backdropFilter: "blur(12px)",
            borderTop: "3px solid #E63946",
            boxShadow: "0 -4px 30px rgba(0,0,0,0.5)",
          }}
        >
          {/* Recording indicator */}
          <div className="flex items-center gap-2 mr-2">
            {recordingState === "recording" && (
              <span className="relative flex h-3 w-3" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E63946] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E63946]"></span>
              </span>
            )}
            <span className="text-white font-mono font-black text-lg tracking-wider">
              {formatTime(elapsed)}
            </span>
            <span className="text-white/50 text-[10px] font-black uppercase tracking-widest hidden sm:inline">
              {recordingState === "recording" ? "REC" : "PAUSED"}
            </span>
          </div>

          {/* Pause / Resume */}
          {recordingState === "recording" ? (
            <button
              onClick={pauseRecording}
              className="flex items-center gap-1.5 bg-[#F77F00] hover:bg-[#E76F51] text-white font-black uppercase text-xs px-5 py-2.5 border-2 border-white/20 transition-colors"
              title="Pause recording (Space)"
            >
              ⏸ Pause
            </button>
          ) : (
            <button
              onClick={resumeRecording}
              className="flex items-center gap-1.5 bg-[#2A9D8F] hover:bg-[#238577] text-white font-black uppercase text-xs px-5 py-2.5 border-2 border-white/20 transition-colors"
              title="Resume recording (Space)"
            >
              ▶ Resume
            </button>
          )}

          {/* Stop */}
          <button
            onClick={stopRecording}
            className="flex items-center gap-1.5 bg-[#E63946] hover:bg-[#c62f3b] text-white font-black uppercase text-xs px-5 py-2.5 border-2 border-white/20 transition-colors"
            title="Stop recording (Escape)"
          >
            ⏹ Stop
          </button>

          {/* Keyboard shortcut hints */}
          <div className="text-white/30 text-[9px] font-bold uppercase tracking-wider ml-2 hidden md:flex items-center gap-2">
            <span className="border border-white/20 px-1.5 py-0.5 rounded">Space</span> Pause
            <span className="border border-white/20 px-1.5 py-0.5 rounded ml-1">Esc</span> Stop
          </div>
        </div>
      )}
    </div>
  );
}
