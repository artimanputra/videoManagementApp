"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Segment {
  start: number;
  end: number;
}

interface VideoTimelineProps {
  duration: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onSegmentsChange?: (segments: Segment[]) => void;
}

const MIN_SEGMENT_SEC = 0.5;

export default function VideoTimeline({
  duration,
  videoRef,
  onSegmentsChange,
}: VideoTimelineProps) {
  const [cuts, setCuts] = useState<number[]>([]);
  const [activeScene, setActiveScene] = useState<number | null>(null);
  const draggingCut = useRef<number | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const previewTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const segments = useMemo<Segment[]>(() => {
    const all = [0, ...cuts, duration].sort((a, b) => a - b);
    return all.slice(0, -1).map((start, i) => ({ start, end: all[i + 1] }));
  }, [cuts, duration]);

  useEffect(() => {
    onSegmentsChange?.(segments);
  }, [segments, onSegmentsChange]);

  const pxToTime = useCallback(
    (clientX: number) => {
      if (!timelineRef.current) return 0;
      const rect = timelineRef.current.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      return Math.max(0, Math.min(duration, ratio * duration));
    },
    [duration]
  );

  const seekPreview = useCallback(
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
      const hi = index === sorted.length - 1
        ? duration - MIN_SEGMENT_SEC
        : sorted[index + 1] - MIN_SEGMENT_SEC;
      return Math.max(lo, Math.min(hi, time));
    },
    [duration]
  );

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
  }, [pxToTime, clampCut]);

  const addCut = () => {
    const currentTime = videoRef?.current?.currentTime ?? duration / 2;
    const clamped = Math.max(MIN_SEGMENT_SEC, Math.min(duration - MIN_SEGMENT_SEC, currentTime));
    setCuts((prev) => {
      if (prev.some((c) => Math.abs(c - clamped) < MIN_SEGMENT_SEC)) return prev;
      return [...prev, clamped].sort((a, b) => a - b);
    });
  };

  const filmStripStyle: React.CSSProperties = {
    backgroundImage: [
      "repeating-linear-gradient(90deg, transparent 0px, transparent 74px, rgba(255,255,255,0.07) 74px, rgba(255,255,255,0.07) 78px)",
      "repeating-linear-gradient(180deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0) 4px)",
      "linear-gradient(180deg, #1a1208 0%, #0d0d0d 40%, #0d0d0d 60%, #1a1208 100%)",
    ].join(", "),
  };

  const sprocketSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='16'><rect x='5' y='2' width='18' height='12' rx='2.5' fill='none' stroke='%23333' stroke-width='1'/><rect x='7' y='4' width='14' height='8' rx='1.5' fill='%23060606'/></svg>`;
  const sprocketBg = `url("data:image/svg+xml,${sprocketSvg}")`;

  const sprocketBarStyle = (isTop: boolean): React.CSSProperties => ({
    position: "absolute",
    left: 0, right: 0,
    height: "16px",
    top: isTop ? 0 : undefined,
    bottom: isTop ? undefined : 0,
    backgroundImage: `${sprocketBg}, linear-gradient(180deg, #0a0a0a 0%, #141414 100%)`,
    backgroundSize: "28px 16px, 100% 100%",
    backgroundRepeat: "repeat-x, no-repeat",
    backgroundPosition: "4px center, 0 0",
    zIndex: 1,
  });

  return (
    <div className="select-none">
      <div
        ref={timelineRef}
        className="relative w-full h-24 rounded-lg overflow-hidden border border-neutral-700"
        style={filmStripStyle}
      >
        <div style={sprocketBarStyle(true)} />
        <div style={sprocketBarStyle(false)} />

        {segments.map((seg, i) => (
          <div
            key={i}
            className={`absolute top-4 h-[calc(100%-2rem)] border-r border-white/10 cursor-pointer transition-colors duration-150
              ${activeScene === i
                ? "bg-blue-500/50 ring-1 ring-inset ring-blue-400/60"
                : "bg-white/5 hover:bg-white/10"
              }`}
            style={{
              left: `${(seg.start / duration) * 100}%`,
              width: `${((seg.end - seg.start) / duration) * 100}%`,
              zIndex: 2,
            }}
            onClick={() => { setActiveScene(i); seekPreview(seg.start); }}
            onMouseEnter={() => {
              previewTimeout.current = setTimeout(() => seekPreview(seg.start), 120);
            }}
            onMouseLeave={() => {
              if (previewTimeout.current) clearTimeout(previewTimeout.current);
            }}
          >
            <div className="p-1.5 text-[10px] leading-tight text-white/80 truncate">
              <div className="font-semibold">Scene {i + 1}</div>
              <div className="text-white/50">
                {formatTime(seg.start)} – {formatTime(seg.end)}
              </div>
            </div>
          </div>
        ))}

        {cuts.map((cut, i) => (
          <div
            key={i}
            className="absolute top-0 h-full flex flex-col items-center z-20 group"
            style={{ left: `calc(${(cut / duration) * 100}% - 6px)`, width: 12 }}
            onMouseDown={(e) => { e.stopPropagation(); draggingCut.current = i; }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-3 h-4 bg-amber-400 rounded-b cursor-ew-resize shadow-lg group-hover:bg-amber-300 transition-colors" />
            <div className="w-0.5 flex-1 bg-amber-400/80 group-hover:bg-amber-300 transition-colors" />
            <div className="w-3 h-4 bg-amber-400 rounded-t cursor-ew-resize shadow-lg group-hover:bg-amber-300 transition-colors" />
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-3 items-center">
        <button
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
          onClick={addCut}
        >
          + Add Cut
        </button>
        {cuts.length > 0 && (
          <button
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
            onClick={() => setCuts((prev) => prev.slice(0, -1))}
          >
            Remove Last Cut
          </button>
        )}
        <span className="ml-auto text-xs text-neutral-500">
          {segments.length} scene{segments.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}