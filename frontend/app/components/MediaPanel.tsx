"use client";

import { Video } from "../types/types";
import { formatTimeShort } from "../utils/utils";
import Link from "next/link";

interface MediaPanelProps {
  video: Video;
  apiBase: string;
}

export default function MediaPanel({ video, apiBase }: MediaPanelProps) {
  return (
    <div className="w-60 flex-shrink-0 border-r border-white/10 flex flex-col bg-[#111]">
   

<div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
  <h2 className="text-white/80 text-md font-bold uppercase tracking-widest">
    Media
  </h2>
    
  <Link
    href={`/videos/${video.id}/edit`}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md 
               bg-white/10 hover:bg-white/20 transition 
               text-white/80 hover:text-white text-xs font-medium"
  >
    {/* Edit Icon */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-3.5 h-3.5"
    >
      <path d="M21.7 6.3a1 1 0 0 0 0-1.4l-2.6-2.6a1 1 0 0 0-1.4 0l-1.8 1.8 4 4 1.8-1.8z" />
      <path d="M3 17.2V21h3.8l11-11-3.8-3.8-11 11z" />
    </svg>

    Edit
  </Link>
</div>

      <div className="flex-1 p-3 overflow-y-auto">       
        <div className="border-2 border-red-500/60 rounded-lg overflow-hidden bg-black/30">
          <div className="aspect-video relative bg-black">
            <video
              src={`${video.video_url}`}
              className="w-full h-full object-cover opacity-80"
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-white/10 backdrop-blur rounded-full flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            
            <div className="absolute bottom-1.5 right-1.5 bg-black/70 rounded px-1.5 py-0.5 text-[10px] text-white/80 font-mono">
              {formatTimeShort(video.duration || 0)}
            </div>
          </div>
          <div className="p-2.5">
            <p className="text-white/80 text-[11px] font-bold truncate">{video.title}</p>
            {video.description && (
              <p className="text-white/30 text-[10px] mt-0.5 truncate">{video.description.trim()}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider
                  ${video.status === "Ready"
                    ? "bg-green-500/20 text-green-400"
                    : video.status === "Processing"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-white/10 text-white/40"
                  }`}
              >
                {video.status}
              </span>
              <span className="text-white/20 text-[9px]">MP4</span>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-white/30 text-[10px] uppercase">Duration</span>
            <span className="text-white/60 text-[10px] font-mono">{formatTimeShort(video.duration || 0)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/30 text-[10px] uppercase">Segments</span>
            <span className="text-white/60 text-[10px] font-mono">{video.segments.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}