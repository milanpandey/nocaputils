"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";

type CropPreset = "free" | "16:9" | "1:1" | "9:16";

type VideoPreviewProps = {
  src: string;
  filter: string;
  transform: string;
  cropPreset: CropPreset;
  textOverlay: string;
  textSize: number;
  textY: number;
  onLoadedMetadata: (duration: number) => void;
};

export type VideoPreviewHandle = {
  getElement: () => HTMLVideoElement | null;
};

const VideoPreview = forwardRef<VideoPreviewHandle, VideoPreviewProps>(
  function VideoPreview(
    { src, filter, transform, cropPreset, textOverlay, textSize, textY, onLoadedMetadata },
    ref,
  ) {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useImperativeHandle(ref, () => ({
      getElement: () => videoRef.current,
    }));

    const aspectClass =
      cropPreset === "16:9"
        ? "aspect-video"
        : cropPreset === "1:1"
          ? "aspect-square"
          : cropPreset === "9:16"
            ? "aspect-[9/16] max-h-[520px]"
            : "";

    return (
      <div className="neo-panel overflow-hidden bg-black p-0">
        <div className={`relative flex items-center justify-center bg-black ${aspectClass}`}
          style={!aspectClass ? { aspectRatio: "16/9" } : undefined}
        >
          <video
            ref={videoRef}
            src={src}
            className="h-full w-full object-contain"
            style={{ filter, transform }}
            controls={false}
            playsInline
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration;
              onLoadedMetadata(Number.isFinite(d) ? d : 0);
            }}
          />

          {textOverlay ? (
            <div
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 px-4 py-2 text-center font-black uppercase tracking-wide text-white"
              style={{
                top: `${textY}%`,
                fontSize: `${textSize}px`,
                textShadow: "0 2px 6px rgba(0,0,0,0.7)",
              }}
            >
              {textOverlay}
            </div>
          ) : null}
        </div>
      </div>
    );
  },
);

export default VideoPreview;
