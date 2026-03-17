"use client";

import { useState, useRef, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export default function VideoEditor() {
    const [loaded, setLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoSrc, setVideoSrc] = useState<string>("");
    const ffmpegRef = useRef<FFmpeg | null>(null);
    const messageRef = useRef<HTMLParagraphElement | null>(null);

    const load = async () => {
        setIsLoading(true);
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

        if (!ffmpegRef.current) {
            ffmpegRef.current = new FFmpeg();
        }
        const ffmpeg = ffmpegRef.current;

        ffmpeg.on("log", ({ message }) => {
            if (messageRef.current) messageRef.current.innerHTML = message;
            console.log(message);
        });

        try {
            // Load ffmpeg-core
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
            });
            setLoaded(true);
        } catch (e) {
            console.error("Failed to load FFmpeg", e);
            if (messageRef.current) messageRef.current.innerHTML = "Error loading FFmpeg. Ensure SharedArrayBuffer is enabled.";
        }
        setIsLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Memory Check (Pre-flight) OOM Prevention
            // @ts-ignore - navigator.deviceMemory is not broadly typed in standard lib yet
            const deviceMemory = navigator.deviceMemory || 4; // Check RAM in GB (fallback to 4GB)
            const maxSizeBytes = (deviceMemory * 1024 * 1024 * 1024) / 4; // Allow max 25% of RAM

            if (file.size > maxSizeBytes) {
                alert(`File is too large! Your device has roughly ${deviceMemory}GB of RAM. Please select a video smaller than ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB.`);
                e.target.value = ''; // Reset input
                return;
            }

            setVideoFile(file);

            // Garbage collect old preview URL to free memory
            if (videoSrc) {
                URL.revokeObjectURL(videoSrc);
            }

            const url = URL.createObjectURL(file);
            setVideoSrc(url);
        }
    };

    // Garbage collection on unmount
    useEffect(() => {
        return () => {
            if (videoSrc) {
                URL.revokeObjectURL(videoSrc);
            }
        };
    }, [videoSrc]);

    const clearVideo = () => {
        if (videoSrc) {
            URL.revokeObjectURL(videoSrc);
        }
        setVideoFile(null);
        setVideoSrc("");
    };

    return (
        <div className="w-full">
            <div className="brutal-card border-[4px] bg-white w-full min-h-[500px] flex items-center justify-center p-6 relative">

                {!loaded && isLoading && (
                    <div className="text-center">
                        <h2 className="text-2xl font-black uppercase mb-4 animate-pulse">Loading Video Engine...</h2>
                        <p className="font-bold text-gray-600">Downloading @ffmpeg/core (~25MB)</p>
                    </div>
                )}

                {!loaded && !isLoading && (
                    <div className="text-center">
                        <h2 className="text-2xl font-black uppercase mb-4 text-red-600">Engine Failed to Load</h2>
                        <p className="font-bold text-gray-600 mb-4" ref={messageRef}></p>
                        <button onClick={load} className="brutal-button bg-neo-yellow px-6 py-2">Retry</button>
                    </div>
                )}

                {loaded && !videoFile && (
                    <div className="w-full max-w-md text-center">
                        <h2 className="text-3xl font-black uppercase mb-4">Select a Video to Begin</h2>
                        <p className="font-bold mb-6 text-gray-600">Your files remain exactly where they are: on your device. We process everything in your browser's memory securely.</p>
                        <div className="relative inline-block">
                            <input
                                type="file"
                                accept="video/mp4,video/x-m4v,video/*"
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <button className="brutal-button bg-neo-yellow px-8 py-4 text-xl">
                                Choose Video File
                            </button>
                        </div>
                        <p className="text-xs font-bold mt-4 uppercase text-gray-400">Supported Formats: MP4, WEBM, MOV</p>
                    </div>
                )}

                {loaded && videoFile && (
                    <div className="w-full h-full flex flex-col pt-4">
                        <div className="flex justify-between items-center mb-4 border-b-[3px] border-black pb-4">
                            <h3 className="font-black text-xl uppercase tracking-tighter shrink-0">{videoFile.name}</h3>
                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={clearVideo}
                                    className="px-4 py-2 bg-gray-200 border-2 border-black font-bold text-sm uppercase shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Player Container */}
                        <div className="bg-black border-[4px] border-black w-full aspect-video flex-grow relative shadow-[6px_6px_0px_#000]">
                            <video
                                src={videoSrc}
                                controls
                                className="w-full h-full object-contain"
                                crossOrigin="anonymous"
                            />
                        </div>

                        {/* Stub for timeline */}
                        <div className="mt-8 border-[4px] border-black h-24 bg-gray-100 relative flex items-center justify-center shadow-[4px_4px_0px_#000]">
                            <p className="font-bold opacity-50 uppercase tracking-widest text-sm">Timeline Under Construction</p>
                        </div>
                        <p ref={messageRef} className="font-mono text-xs mt-4 h-4 overflow-hidden text-gray-500"></p>
                    </div>
                )}

            </div>
        </div>
    );
}
