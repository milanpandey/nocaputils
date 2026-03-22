"use client";

import { useRef, forwardRef, useImperativeHandle, useState, useEffect } from "react";

type CropPreset = "free" | "16:9" | "1:1" | "9:16";

type VideoPreviewProps = {
  src: string;
  filter: string;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
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
    { src, filter, rotation, flipH, flipV, cropPreset, textOverlay, textSize, textY, onLoadedMetadata },
    ref,
  ) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

    useImperativeHandle(ref, () => ({
      getElement: () => videoRef.current,
    }));

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerSize({
            w: entry.contentRect.width,
            h: entry.contentRect.height,
          });
        }
      });
      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    const aspectClass =
      cropPreset === "16:9"
        ? "aspect-video"
        : cropPreset === "1:1"
          ? "aspect-square"
          : cropPreset === "9:16"
            ? "aspect-[9/16] max-h-[520px]"
            : "";

    const r = ((rotation % 360) + 360) % 360;
    const isRotated90 = r === 90 || r === 270;
    const transformStr = `translate(-50%, -50%) rotate(${rotation}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`;

    return (
      <div className="neo-panel overflow-hidden bg-black p-0">
        <div 
          ref={containerRef}
          className={`relative flex items-center justify-center bg-black ${aspectClass}`}
          style={!aspectClass ? { aspectRatio: "16/9" } : undefined}
        >
          <video
            ref={videoRef}
            src={src}
            className="absolute left-1/2 top-1/2 object-contain"
            style={{ 
              filter, 
              transform: transformStr,
              width: isRotated90 && containerSize.h ? `${containerSize.h}px` : "100%",
              height: isRotated90 && containerSize.w ? `${containerSize.w}px` : "100%",
            }}
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
