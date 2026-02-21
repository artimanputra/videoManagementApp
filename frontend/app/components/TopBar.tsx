"use client";

import Link from "next/link";
import { Video } from "../types/types";

interface TopBarProps {
  video: Video;
  splitting: boolean;
  canSplit: boolean;
  splitError: string;
  onSplit: () => void;
}

export default function TopBar({ video, splitting, canSplit, splitError, onSplit }: TopBarProps) {
  return (
    <header className="h-12 flex items-center gap-4 px-5 border-b border-white/10 bg-[#111] flex-shrink-0">
      <Link
        href="/dashboard"
        className="text-white/40 hover:text-white/70 text-sm transition-colors flex items-center gap-1.5"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      <div className="w-px h-5 bg-white/10" />
      <div className="flex flex-col leading-none">
        <span className="text-[9px] text-white/25 uppercase tracking-wider">Project</span>
        <span className="text-white/80 text-md font-bold truncate max-w-[220px] mt-0.5">
          {video.title}
        </span>
      </div>

      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
          ${video.status === "Ready"
            ? "bg-green-500/15 text-green-400 ring-1 ring-green-500/30"
            : video.status === "Processing"
            ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30"
            : "bg-white/5 text-white/30"
          }`}
      >
        {video.status}
      </span>

      <div className="ml-auto flex items-center gap-3">
        {splitError && (
          <span className="text-red-400 text-[11px] max-w-xs truncate">{splitError}</span>
        )}

        {!canSplit && !splitting && (
          <span className="text-white/20 text-[11px]">Add cuts to enable split</span>
        )}

        <button
          onClick={onSplit}
          disabled={splitting || !canSplit}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:bg-white/8 disabled:text-white/25 text-white px-4 py-1.5 rounded-lg text-md font-bold transition-all"
        >
          {splitting ? (
            <>
              <div className="w-3 h-3 border-[1.5px] border-white/40 border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
              </svg>

              Save Splits
            </>
          )}
        </button>
      </div>
    </header>
  );
}