"use client";

import { RefObject } from "react";
import { Segment } from "../types/types";
import { formatTimeLong, formatTimeShort } from "../utils/utils";
import { useEffect } from "react";


interface PreviewPanelProps {
  videoSrc: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  onVideoReady: () => void;
  currentSegment: Segment | undefined;
  selectedScene: number;
  totalScenes: number;
  onPrevScene: () => void;
  onNextScene: () => void;
}

export default function PreviewPanel({
  videoSrc,
  videoRef,
  onVideoReady,
  currentSegment,
  selectedScene,
  totalScenes,
  onPrevScene,
  onNextScene,
}: PreviewPanelProps) {
  
  useEffect(() => {
  const video = videoRef.current;
  if (!video || !currentSegment) return;

  // Seek to the start of the selected scene
  video.currentTime = currentSegment.start;

  // Autoplay (optional)
  video.play().catch(() => {
    // autoplay may be blocked — safe to ignore
  });
}, [currentSegment, videoRef]);


  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] min-w-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
        <h2 className="text-white/80 text-md font-bold uppercase tracking-widest">Preview</h2>
      </div>

      {/* Player area */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
        <div className="w-full max-w-2xl flex flex-col gap-3">
          {/* Video */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video ring-1 ring-white/10">
            <video
              // key={videoSrc}
              ref={videoRef}
              src={videoSrc}
              controls
              preload="auto"
              className="w-full h-full"
              onLoadedMetadata={onVideoReady}
            />
          </div>

          {/* Timecode bar */}
          {currentSegment && (
            <div className="flex items-center gap-3 px-1">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white/40 text-[11px] font-mono">
                  Scene {selectedScene + 1}
                </span>
              </div>
              <span className="text-white/20 text-[11px] font-mono">
                {formatTimeLong(currentSegment.start)}
              </span>
              <span className="text-white/10 text-[11px]">/</span>
              <span className="text-white/20 text-[11px] font-mono">
                {formatTimeLong(currentSegment.end)}
              </span>
              <span className="ml-auto text-white/30 text-[11px] font-mono">
                ⏱ {formatTimeShort(currentSegment.end - currentSegment.start)}
              </span>
            </div>
          )}

          {/* Scene navigation */}
          {totalScenes > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                disabled={selectedScene === 0}
                onClick={onPrevScene}
                className="flex items-center gap-1.5 text-white/40 hover:text-white/80 disabled:opacity-20 text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Prev
              </button>

              {/* Scene dots */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalScenes, 10) }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all ${
                      i === selectedScene
                        ? "w-3 h-1.5 bg-red-500"
                        : "w-1.5 h-1.5 bg-white/15"
                    }`}
                  />
                ))}
                {totalScenes > 10 && (
                  <span className="text-white/20 text-[10px] ml-1">+{totalScenes - 10}</span>
                )}
              </div>

              <button
                disabled={selectedScene >= totalScenes - 1}
                onClick={onNextScene}
                className="flex items-center gap-1.5 text-white/40 hover:text-white/80 disabled:opacity-20 text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
              >
                Next
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}