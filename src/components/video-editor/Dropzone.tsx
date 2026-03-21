"use client";

import { useCallback, useRef, useState } from "react";

type DropzoneProps = {
  onFiles: (files: FileList | null) => void;
};

export default function Dropzone({ onFiles }: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(false);
      onFiles(event.dataTransfer.files);
    },
    [onFiles],
  );

  return (
    <div
      className={`neo-panel flex min-h-[480px] flex-col items-center justify-center bg-[var(--bg-panel)] px-8 py-16 text-center transition ${
        isDragOver ? "translate-x-[2px] translate-y-[2px] shadow-none" : ""
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />

      <div className="flex h-20 w-20 items-center justify-center border-4 border-[var(--border-main)] bg-[var(--bg-panel)] text-3xl shadow-[4px_4px_0_0_var(--border-main)]">
        ⇧
      </div>

      <h2 className="mt-8 text-3xl font-black uppercase tracking-tight">
        Select a Video
      </h2>

      <p className="mt-3 text-sm font-bold uppercase tracking-widest text-[var(--text-soft)]">
        MP4 &middot; WEBM &middot; MOV
      </p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="neo-button mt-8 bg-[var(--accent)] px-8 py-4 text-base font-black uppercase tracking-wide text-black"
      >
        Choose File
      </button>

      <p className="mt-6 text-xs font-bold uppercase tracking-widest text-[var(--text-soft)]/60">
        or drag &amp; drop here
      </p>
    </div>
  );
}
