"use client";

import { useCallback, useEffect, useMemo, useRef, useState, RefObject, Dispatch, SetStateAction } from "react";
import { Segment } from "../types/types";
import { formatTimeShort } from "../utils/utils";

const MIN_SEGMENT_SEC = 0.5;

interface VideoTimelineProps {
  duration: number;
  videoRef: RefObject<HTMLVideoElement | null>;
  cuts: number[];
  setCuts: Dispatch<SetStateAction<number[]>>;
  onSegmentsChange?: (segments: Segment[]) => void;
}

export default function VideoTimeline({
  duration,
  videoRef,
  cuts,
  setCuts,
  onSegmentsChange,
}: VideoTimelineProps) {
  const [playhead, setPlayhead] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [activeScene, setActiveScene] = useState<number | null>(null);
  const draggingCut = useRef<number | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const previewTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derive segments from cuts
  const segments = useMemo<Segment[]>(() => {
    const all = [0, ...cuts, duration].sort((a, b) => a - b);
    return all.slice(0, -1).map((start, i) => ({ start, end: all[i + 1] }));
  }, [cuts, duration]);

  useEffect(() => {
    onSegmentsChange?.(segments);
  }, [segments, onSegmentsChange]);

  // Track playhead
  useEffect(() => {
    const v = videoRef?.current;
    if (!v) return;
    const handler = () => setPlayhead(v.currentTime);
    v.addEventListener("timeupdate", handler);
    return () => v.removeEventListener("timeupdate", handler);
  }, [videoRef]);

  const pxToTime = useCallback(
    (clientX: number) => {
      if (!timelineRef.current) return 0;
      const rect = timelineRef.current.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      return Math.max(0, Math.min(duration, ratio * duration));
    },
    [duration]
  );

  const seekTo = useCallback(
    (time: number) => {
      const v = videoRef?.current;
      if (!v) return;
      v.pause();
      v.currentTime = time;
    },
    [videoRef]
  );

  const clampCut = useCallback(
    (time: number, index: number, prevCuts: number[]) => {
      const sorted = [...prevCuts].sort((a, b) => a - b);
      const lo = index === 0 ? MIN_SEGMENT_SEC : sorted[index - 1] + MIN_SEGMENT_SEC;
      const hi =
        index === sorted.length - 1
          ? duration - MIN_SEGMENT_SEC
          : sorted[index + 1] - MIN_SEGMENT_SEC;
      return Math.max(lo, Math.min(hi, time));
    },
    [duration]
  );

  // Global mouse move/up for dragging cut handles
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (draggingCut.current === null) return;
      const idx = draggingCut.current;
      setCuts((prev) => {
        const next = [...prev];
        next[idx] = clampCut(pxToTime(e.clientX), idx, next);
        return next;
      });
    };
    const onUp = () => { draggingCut.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [pxToTime, clampCut, setCuts]);

  const addCutAtPlayhead = () => {
    const currentTime = videoRef?.current?.currentTime ?? duration / 2;
    const clamped = Math.max(MIN_SEGMENT_SEC, Math.min(duration - MIN_SEGMENT_SEC, currentTime));
    setCuts((prev) => {
      if (prev.some((c) => Math.abs(c - clamped) < MIN_SEGMENT_SEC)) return prev;
      return [...prev, clamped].sort((a, b) => a - b);
    });
  };

  // Time ruler marks
  const rulerMarks = useMemo(() => {
    const marks: number[] = [];
    const step = duration > 120 ? 10 : duration > 60 ? 5 : duration > 20 ? 2 : 1;
    for (let t = 0; t <= duration; t += step) marks.push(t);
    return marks;
  }, [duration]);

  return (
    <div className="flex flex-col h-full bg-[#111111] select-none">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 flex-shrink-0">
        <button
          onClick={addCutAtPlayhead}
          className="flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded transition-all"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 3 L6 21 M18 3 L18 21 M6 12 L18 12" />
          </svg>
          Split at Playhead
        </button>

        {cuts.length > 0 && (
          <button
            onClick={() => setCuts((prev) => prev.slice(0, -1))}
            className="flex items-center gap-1.5 text-xs text-red-400/80 hover:text-red-300 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded transition-all"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
            Remove Last Cut
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-white/20 text-[10px] uppercase tracking-wider">Zoom</span>
          <input
            type="range" min="1" max="6" step="0.5" value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-20 accent-red-500 cursor-pointer"
          />
          <span className="text-white/30 text-[10px] w-5 font-mono">{zoom}x</span>
        </div>

        <div className="text-white/20 text-[10px] ml-2">
          {segments.length} scene{segments.length !== 1 ? "s" : ""}
          {cuts.length > 0 && ` · ${cuts.length} cut${cuts.length !== 1 ? "s" : ""}`}
        </div>
      </div>

      {/* ── Scrollable track area ── */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div style={{ width: `${zoom * 100}%`, minWidth: "100%", height: "100%", position: "relative" }}>

          {/* Time ruler */}
          <div className="h-6 border-b border-white/10 relative bg-[#0d0d0d] flex-shrink-0">
            {rulerMarks.map((t) => (
              <div
                key={t}
                className="absolute top-0 flex flex-col items-start"
                style={{ left: `${(t / duration) * 100}%` }}
              >
                <div className="h-2.5 w-px bg-white/15" />
                <span className="text-[9px] text-white/25 mt-0.5 pl-0.5 font-mono">
                  {formatTimeShort(t)}
                </span>
              </div>
            ))}
            {/* Half-marks */}
            {rulerMarks.slice(0, -1).map((t, i) => {
              const mid = t + (rulerMarks[i + 1] - t) / 2;
              return (
                <div
                  key={`mid-${t}`}
                  className="absolute top-0"
                  style={{ left: `${(mid / duration) * 100}%` }}
                >
                  <div className="h-1.5 w-px bg-white/8" />
                </div>
              );
            })}
          </div>

          {/* Film track */}
          <div
            ref={timelineRef}
            className="relative mx-3 my-1.5 rounded-lg overflow-hidden border border-white/10 cursor-crosshair"
            style={{
              height: "68px",
              background: "linear-gradient(180deg, #181208 0%, #0d0d0d 25%, #0d0d0d 75%, #181208 100%)",
            }}
            onClick={(e) => {
              const t = pxToTime(e.clientX);
              seekTo(t);
            }}
          >
            {/* Sprocket holes - top */}
            <div className="absolute top-0 left-0 right-0 h-[14px] flex overflow-hidden z-[1] bg-[#0a0a0a]">
              {Array.from({ length: 60 }).map((_, i) => (
                <div key={i} className="w-[26px] h-full flex items-center justify-center flex-shrink-0">
                  <div className="w-[14px] h-[8px] rounded-sm border border-white/10 bg-black/70" />
                </div>
              ))}
            </div>
            {/* Sprocket holes - bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-[14px] flex overflow-hidden z-[1] bg-[#0a0a0a]">
              {Array.from({ length: 60 }).map((_, i) => (
                <div key={i} className="w-[26px] h-full flex items-center justify-center flex-shrink-0">
                  <div className="w-[14px] h-[8px] rounded-sm border border-white/10 bg-black/70" />
                </div>
              ))}
            </div>

            {/* Segment zones */}
            {segments.map((seg, i) => (
              <div
                key={i}
                className={`absolute top-[14px] bottom-[14px] border-r border-white/8 cursor-pointer transition-all duration-100 z-[2]
                  ${activeScene === i
                    ? "bg-red-500/25 ring-1 ring-inset ring-red-400/50"
                    : "bg-white/4 hover:bg-white/8"
                  }`}
                style={{
                  left: `${(seg.start / duration) * 100}%`,
                  width: `${((seg.end - seg.start) / duration) * 100}%`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveScene(i);
                  seekTo(seg.start);
                }}
                onMouseEnter={() => {
                  previewTimeout.current = setTimeout(() => seekTo(seg.start), 120);
                }}
                onMouseLeave={() => {
                  if (previewTimeout.current) clearTimeout(previewTimeout.current);
                }}
              >
                <div className="px-1.5 pt-1 text-[9px] leading-tight text-white/60 truncate pointer-events-none">
                  <div className="font-bold">S{i + 1}</div>
                  <div className="text-white/35">{formatTimeShort(seg.start)}</div>
                </div>
              </div>
            ))}

            {/* Cut handles (amber) */}
            {cuts.map((cut, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 flex flex-col items-center z-[20] group cursor-ew-resize"
                style={{ left: `calc(${(cut / duration) * 100}% - 5px)`, width: 10 }}
                onMouseDown={(e) => { e.stopPropagation(); draggingCut.current = i; }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Top tab */}
                <div className="w-2.5 h-[14px] bg-amber-400 group-hover:bg-amber-300 transition-colors rounded-b flex items-end justify-center pb-0.5">
                  <div className="w-0.5 h-2 bg-amber-800/60 rounded-full" />
                </div>
                {/* Line */}
                <div className="w-[2px] flex-1 bg-amber-400/85 group-hover:bg-amber-300 transition-colors" />
                {/* Bottom tab */}
                <div className="w-2.5 h-[14px] bg-amber-400 group-hover:bg-amber-300 transition-colors rounded-t flex items-start justify-center pt-0.5">
                  <div className="w-0.5 h-2 bg-amber-800/60 rounded-full" />
                </div>

                {/* Time tooltip */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-400 text-black text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {formatTimeShort(cut)}
                </div>
              </div>
            ))}

            {/* Playhead */}
            {duration > 0 && (
              <div
                className="absolute top-0 bottom-0 z-[30] pointer-events-none"
                style={{ left: `${(playhead / duration) * 100}%` }}
              >
                {/* Triangle head */}
                <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[8px] border-l-transparent border-r-transparent border-t-white -translate-x-[5px]" />
                {/* Line */}
                <div className="w-[1.5px] h-full bg-white/75 -translate-x-[0.75px]" />
              </div>
            )}
          </div>

          {/* Hint bar */}
          <div className="px-4 pb-1 text-[9px] text-white/15 flex items-center gap-4">
            <span>Click to seek</span>
            <span>·</span>
            <span>Drag 🟡 handles to adjust cuts</span>
            <span>·</span>
            <span>Hover scene to preview</span>
          </div>
        </div>
      </div>
    </div>
  );
}