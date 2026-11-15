"use client";

import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { CropMode, CropPreset } from "./useUndoHistory";

type VideoPreviewProps = {
  src: string;
  filter: string;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  cropPreset: CropPreset;
  cropMode: CropMode;
  textOverlay: string;
  textSize: number;
  textX: number;
  textY: number;
  textColor: string;
  textBg: boolean;
  isPlaying: boolean;
  isWorkspaceFullscreen?: boolean;
  onTogglePlay: () => void;
  onTextPositionChange?: (x: number, y: number) => void;
  onTextDragStart?: () => void;
  onTextDragEnd?: () => void;
  onLoadedMetadata: (info: { duration: number; width: number; height: number }) => void;
};

export type VideoPreviewHandle = {
  getElement: () => HTMLVideoElement | null;
};

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

const VideoPreview = memo(
  forwardRef<VideoPreviewHandle, VideoPreviewProps>(function VideoPreview(
    {
      src,
      filter,
      rotation,
      flipH,
      flipV,
      cropPreset,
      cropMode,
      textOverlay,
      textSize,
      textX,
      textY,
      textColor,
      textBg,
      isPlaying,
      isWorkspaceFullscreen = false,
      onTogglePlay,
      onTextPositionChange,
      onTextDragStart,
      onTextDragEnd,
      onLoadedMetadata,
    },
    ref,
  ) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const outerRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
    const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
    const [isDraggingText, setIsDraggingText] = useState(false);
    const [snapGuides, setSnapGuides] = useState({ x: false, y: false });
    const didDragTextRef = useRef(false);

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

    useEffect(() => {
      const onFsChange = () => {
        setIsPreviewFullscreen(document.fullscreenElement === outerRef.current);
      };
      document.addEventListener("fullscreenchange", onFsChange);
      return () => document.removeEventListener("fullscreenchange", onFsChange);
    }, []);

    const togglePreviewFullscreen = useCallback(async (e: React.MouseEvent) => {
      e.stopPropagation();
      const target = outerRef.current;
      if (!target) return;
      try {
        if (document.fullscreenElement === target) {
          await document.exitFullscreen();
        } else {
          await target.requestFullscreen();
        }
      } catch {
        // Ignore fullscreen rejection if unsupported or blocked
      }
    }, []);

    const handleTextPointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!onTextPositionChange) return;
        e.stopPropagation();
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        didDragTextRef.current = false;
        setIsDraggingText(true);
        onTextDragStart?.();
      },
      [onTextDragStart, onTextPositionChange],
    );

    const handleTextPointerMove = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingText || !containerRef.current || !onTextPositionChange) return;
        const rect = containerRef.current.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        didDragTextRef.current = true;

        const rawX = ((e.clientX - rect.left) / rect.width) * 100;
        const rawY = ((e.clientY - rect.top) / rect.height) * 100;
        const snapX = Math.abs(rawX - 50) <= 2.5;
        const snapY = Math.abs(rawY - 50) <= 2.5;
        const nextX = Math.round(clamp(snapX ? 50 : rawX, 10, 90));
        const nextY = Math.round(clamp(snapY ? 50 : rawY, 10, 90));

        setSnapGuides({ x: snapX, y: snapY });
        onTextPositionChange(nextX, nextY);
      },
      [isDraggingText, onTextPositionChange],
    );

    const finishTextDrag = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingText) return;
        e.stopPropagation();
        setIsDraggingText(false);
        setSnapGuides({ x: false, y: false });
        onTextDragEnd?.();
      },
      [isDraggingText, onTextDragEnd],
    );

    // Aspect box sizing: preserves true aspect geometry for crop/text placement
    const aspectClass =
      cropPreset === "1:1"
        ? isWorkspaceFullscreen || isPreviewFullscreen
          ? "aspect-square h-full max-h-full max-w-full mx-auto"
          : "aspect-square h-[440px] max-w-full mx-auto"
        : cropPreset === "9:16"
          ? isWorkspaceFullscreen || isPreviewFullscreen
            ? "aspect-[9/16] h-full max-h-full max-w-full mx-auto"
            : "aspect-[9/16] h-[480px] max-w-full mx-auto"
          : isWorkspaceFullscreen || isPreviewFullscreen
            ? "aspect-video h-full max-h-full max-w-full mx-auto"
            : "aspect-video w-full mx-auto";

    const r = ((rotation % 360) + 360) % 360;
    const isRotated90 = r === 90 || r === 270;
    const transformStr = `translate(-50%, -50%) rotate(${rotation}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`;
    const fitClass =
      cropPreset !== "free" && cropMode === "crop" ? "object-cover" : "object-contain";
    const scaledFontSize = Math.max(
      12,
      Math.round((containerSize.h || 360) * (textSize / 500)),
    );

    return (
      <div
        ref={outerRef}
        onClick={() => {
          if (didDragTextRef.current) {
            didDragTextRef.current = false;
            return;
          }
          onTogglePlay();
        }}
        className={`neo-panel group relative flex cursor-pointer items-center justify-center overflow-hidden bg-black p-0 ${
          isWorkspaceFullscreen || isPreviewFullscreen ? "h-full min-h-0 flex-1" : ""
        }`}
        title={isPlaying ? "Click video to pause (Space)" : "Click video to play (Space)"}
      >
        <div
          ref={containerRef}
          className={`relative flex items-center justify-center overflow-hidden bg-black ${aspectClass}`}
        >
          <video
            ref={videoRef}
            src={src}
            className={`absolute left-1/2 top-1/2 ${fitClass}`}
            style={{
              filter,
              transform: transformStr,
              width: isRotated90 && containerSize.h ? `${containerSize.h}px` : "100%",
              height: isRotated90 && containerSize.w ? `${containerSize.w}px` : "100%",
            }}
            controls={false}
            playsInline
            onLoadedMetadata={(e) => {
              const vid = e.currentTarget;
              onLoadedMetadata({
                duration: Number.isFinite(vid.duration) ? vid.duration : 0,
                width: vid.videoWidth || 1280,
                height: vid.videoHeight || 720,
              });
            }}
          />

          {/* Center alignment guides shown only while dragging text */}
          {isDraggingText && snapGuides.x && (
            <div className="pointer-events-none absolute inset-y-0 left-1/2 w-[1px] -translate-x-1/2 border-l border-dashed border-[var(--accent)] opacity-90" />
          )}
          {isDraggingText && snapGuides.y && (
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[1px] -translate-y-1/2 border-t border-dashed border-[var(--accent)] opacity-90" />
          )}

          {textOverlay ? (
            <div
              onPointerDown={handleTextPointerDown}
              onPointerMove={handleTextPointerMove}
              onPointerUp={finishTextDrag}
              onPointerCancel={finishTextDrag}
              onClick={(e) => e.stopPropagation()}
              className={`absolute -translate-x-1/2 -translate-y-1/2 select-none whitespace-pre-wrap text-center font-black uppercase tracking-wide ${
                onTextPositionChange ? "cursor-move" : "pointer-events-none"
              } ${isDraggingText ? "ring-2 ring-[var(--accent)]" : "hover:ring-1 hover:ring-white/50"}`}
              style={{
                left: `${textX}%`,
                top: `${textY}%`,
                color: textColor,
                fontSize: `${scaledFontSize}px`,
                lineHeight: 1.15,
                padding: textBg ? "4px 12px" : "2px 6px",
                backgroundColor: textBg ? "rgba(0, 0, 0, 0.68)" : "transparent",
                textShadow: textBg ? "none" : "0 2px 6px rgba(0,0,0,0.8)",
                maxWidth: "90%",
              }}
              title={onTextPositionChange ? "Drag to reposition text" : undefined}
            >
              {textOverlay}
            </div>
          ) : null}
        </div>

        {/* Subtle Top Overlay: Playback Hint + Frame Fullscreen Button */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <span className="border-2 border-black bg-black/75 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
            {isPlaying ? "⏸ Playing" : "▶ Click to Play"}
          </span>
          <button
            type="button"
            onClick={togglePreviewFullscreen}
            className="pointer-events-auto border-2 border-black bg-[var(--bg-panel)] px-2 py-1 text-xs font-black uppercase tracking-wider text-[var(--text-main)] shadow-[2px_2px_0_0_#000] hover:bg-[var(--accent)] hover:text-black"
            title={isPreviewFullscreen ? "Exit Video Fullscreen" : "Fullscreen Video Frame"}
            aria-label={isPreviewFullscreen ? "Exit Video Fullscreen" : "Fullscreen Video Frame"}
          >
            {isPreviewFullscreen ? "✕ Exit" : "⛶ Frame"}
          </button>
        </div>
      </div>
    );
  }),
);

VideoPreview.displayName = "VideoPreview";

export default VideoPreview;
