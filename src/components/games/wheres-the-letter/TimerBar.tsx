"use client";

import { useEffect, useState } from "react";

interface TimerBarProps {
  startTime: number | null;
  durationMs: number;
}

export default function TimerBar({ startTime, durationMs }: TimerBarProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!startTime) return;

    let frameId: number;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const remaining = durationMs - elapsed;

      if (remaining <= 0) {
        setProgress(0);
      } else {
        setProgress((remaining / durationMs) * 100);
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [startTime, durationMs]);

  if (!startTime) return null;

  // Colors based on remaining time
  let barColor = "bg-green-400";
  if (progress <= 50 && progress > 20) {
    barColor = "bg-yellow-400";
  } else if (progress <= 20) {
    barColor = "bg-red-400";
  }

  return (
    <div className="w-full max-w-sm mx-auto mt-6 mb-2 h-4 bg-gray-800 rounded-full overflow-hidden shadow-inner" aria-hidden="true">
      <div
        className={`h-full transition-colors duration-300 rounded-full ${barColor}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
