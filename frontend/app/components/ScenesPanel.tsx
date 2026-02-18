"use client";

import { VideoSegment, Segment, SegmentGroup } from "../types/types";
import { formatTimeShort, formatDate, groupSegmentsByBatch } from "../utils/utils";

interface ScenesPanelProps {
  // Live cuts (not yet split/saved)
  liveSegments: Segment[];
  selectedScene: number;
  onSelectScene: (index: number) => void;
  totalDuration: number;

  // Saved segments from DB
  savedSegments: VideoSegment[];
  apiBase: string;

  // Split results from latest operation (URLs)
  splitResult: string[];
}

function LiveSceneItem({
  seg,
  index,
  isSelected,
  totalDuration,
  onSelect,
}: {
  seg: Segment;
  index: number;
  isSelected: boolean;
  totalDuration: number;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`rounded-lg cursor-pointer transition-all duration-150 overflow-hidden border
        ${isSelected
          ? "border-red-500/60 bg-red-900/20"
          : "border-transparent hover:border-white/10 hover:bg-white/5"
        }`}
    >
      <div className={`flex items-center gap-2 px-3 py-2 ${isSelected ? "bg-red-600/20" : ""}`}>
        <div
          className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0
            ${isSelected ? "bg-red-500 text-white" : "bg-white/10 text-white/50"}`}
        >
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/80 text-xs font-bold">Scene {index + 1}</p>
          <p className="text-white/40 text-[10px]">
            {formatTimeShort(seg.start)} → {formatTimeShort(seg.end)}
          </p>
        </div>
        <span className="text-white/30 text-[10px] flex-shrink-0 font-mono">
          {formatTimeShort(seg.end - seg.start)}
        </span>
      </div>

      {/* Progress bar showing position in full video */}
      <div className="px-3 pb-2">
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${isSelected ? "bg-red-500" : "bg-white/20"}`}
            style={{
              marginLeft: `${(seg.start / (totalDuration || 1)) * 100}%`,
              width: `${((seg.end - seg.start) / (totalDuration || 1)) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function SavedSegmentGroup({
  group,
  groupIndex,
  apiBase,
  totalDuration,
}: {
  group: SegmentGroup;
  groupIndex: number;
  apiBase: string;
  totalDuration: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
      {/* Group header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-white/[0.03]">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
        <span className="text-green-400 text-[10px] font-bold uppercase tracking-wider">
          Split #{groupIndex + 1}
        </span>
        <span className="text-white/20 text-[9px] ml-auto">{formatDate(group.createdAt)}</span>
      </div>

      {/* Segments in this group */}
      <div className="divide-y divide-white/5">
        {group.segments.map((seg, i) => (
          <div key={seg.id} className="flex items-center gap-2 px-3 py-2">
            <div className="w-5 h-5 rounded bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-green-400 text-[9px] font-bold">{i + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/60 text-[10px] font-semibold">
                {formatTimeShort(seg.start)} → {formatTimeShort(seg.end)}
              </p>
              {/* Mini bar */}
              <div className="h-0.5 bg-white/5 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-green-500/50 rounded-full"
                  style={{
                    marginLeft: `${(seg.start / (totalDuration || 1)) * 100}%`,
                    width: `${((seg.end - seg.start) / (totalDuration || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <button
              onClick={async (e) => {
                e.stopPropagation();

                const res = await fetch(`${apiBase}${seg.segment_url}`, {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                });

                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);

                const a = document.createElement("a");
                a.href = url;
                a.download = `scene_${i + 1}.mp4`;
                document.body.appendChild(a);
                a.click();
                a.remove();

                window.URL.revokeObjectURL(url);
              }}
              title="Download segment"
              className="flex-shrink-0 w-6 h-6 bg-green-500/10 hover:bg-green-500/20
                        border border-green-500/30 hover:border-green-400/50
                        rounded flex items-center justify-center transition-all"
            >
              {/* icon */}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-400">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>  
            </button>

          </div>
        ))}
      </div>
    </div>
  );
}

export default function ScenesPanel({
  liveSegments,
  selectedScene,
  onSelectScene,
  totalDuration,
  savedSegments,
  apiBase,
  splitResult,
}: ScenesPanelProps) {
  const segmentGroups = groupSegmentsByBatch(savedSegments);
  const hasSaved = segmentGroups.length > 0;

  return (
    <div className="w-72 flex-shrink-0 border-r border-white/10 flex flex-col bg-[#111]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between flex-shrink-0">
        <h2 className="text-white/80 text-md font-bold uppercase tracking-widest">Scenes</h2>
        <span className="w-5 h-5 bg-white/10 rounded-full text-[10px] text-white/50 flex items-center justify-center font-bold">
          {liveSegments.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── Live cuts (pending split) ─────────────────────── */}
        <div className="p-2 space-y-1">
          {liveSegments.length === 0 ? (
            <div className="text-center py-8 text-white/20 text-xs">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 opacity-40">
                <path d="M6 3 L6 21 M18 3 L18 21 M6 12 L18 12" />
              </svg>
              <p>No cuts yet</p>
              <p className="mt-1 text-[10px]">Add cuts in the timeline below</p>
            </div>
          ) : (
            liveSegments.map((seg, i) => (
              <LiveSceneItem
                key={i}
                seg={seg}
                index={i}
                isSelected={selectedScene === i}
                totalDuration={totalDuration}
                onSelect={() => onSelectScene(i)}
              />
            ))
          )}
        </div>

        {/* ── Divider between live and saved ───────────────── */}
        {hasSaved && (
          <div className="flex items-center gap-2 px-3 py-2 border-t border-white/10 mt-1">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-white/20 text-[10px] uppercase tracking-widest whitespace-nowrap">
              Processed Splits
            </span>
            <div className="flex-1 h-px bg-white/5" />
          </div>
        )}

        {/* ── Saved segment groups ──────────────────────────── */}
        {hasSaved && (
          <div className="px-2 pb-3 space-y-2">
            {segmentGroups.map((group, gi) => (
              <SavedSegmentGroup
                key={group.createdAt}
                group={group}
                groupIndex={gi}
                apiBase={apiBase}
                totalDuration={totalDuration}
              />
            ))}
          </div>
        )}
      </div>

      {/* Latest split success banner */}
      {splitResult.length > 0 && (
        <div className="p-3 border-t border-white/10 flex-shrink-0">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <p className="text-green-400 text-[10px] font-bold flex items-center gap-1.5 mb-1.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Split successful — {splitResult.length} segment{splitResult.length !== 1 ? "s" : ""}
            </p>
            {splitResult.map((url, i) => (
              <a
                key={i}
                href={`${apiBase}${url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400/60 hover:text-green-300 text-[9px] block truncate transition-colors"
              >
                → Segment {i + 1}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}