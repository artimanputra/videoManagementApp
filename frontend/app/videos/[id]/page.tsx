"use client";

import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";

import { Video, Segment, SegmentGroup } from "../../types/types";
import { groupSegmentsByBatch } from "../../utils/utils";
import TopBar from "../../components/TopBar";
import MediaPanel from "../../components/MediaPanel";
import ScenesPanel from "../../components/ScenesPanel";
import PreviewPanel from "../../components/PreviewPanel";
import VideoTimeline from "../../components/VideoTimeline";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function VideoEditorPage() {
  const params = useParams();
  const id = params.id as string;

  // ── Data ─────────────────────────────────────────────────────────────────────
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Editor state ─────────────────────────────────────────────────────────────
  const [cuts, setCuts] = useState<number[]>([]);
  const [liveSegments, setLiveSegments] = useState<Segment[]>([]);
  const [selectedScene, setSelectedScene] = useState(0);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Which saved split group is currently loaded into the timeline
  // null = user has made their own cuts not matching any saved group
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);

  // ── Split state ──────────────────────────────────────────────────────────────
  const [splitting, setSplitting] = useState(false);
  const [splitResult, setSplitResult] = useState<string[]>([]);
  const [splitError, setSplitError] = useState("");

  // ── Fetch video + auto-hydrate timeline from latest split ────────────────────
  useEffect(() => {
    fetch(`${API}/videos/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Video not found (HTTP ${r.status})`);
        return r.json();
      })
      .then((data: Video) => {
        setVideo(data);

        // Auto-load the most recent split group into the timeline on first load
        if (data.segments && data.segments.length > 0) {
          const groups = groupSegmentsByBatch(data.segments);
          if (groups.length > 0) {
            const latest = groups[0]; // already sorted newest-first
            const cutsFromGroup = latest.segments
              .slice(0, -1) // all segment ends except the last become cut points
              .map((seg) => seg.end);
            setCuts(cutsFromGroup);
            setActiveGroupKey(latest.createdAt);
          }
        }
      })
      .catch((err) => setError(err.message || "Failed to load video."))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Seek ────────────────────────────────────────────────────────────────────
  const seekTo = useCallback((time: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = time;
  }, []);

  // ── Scene selection ──────────────────────────────────────────────────────────
  const handleSelectScene = useCallback(
  (index: number) => {
    setSelectedScene(index);

    const seg = liveSegments[index];
    const v = videoRef.current;

    if (seg && v) {
      v.currentTime = seg.start;
      v.play(); 
    }
  },
  [liveSegments]
);


  const handlePrevScene = useCallback(() => {
    const next = selectedScene - 1;
    if (next >= 0) handleSelectScene(next);
  }, [selectedScene, handleSelectScene]);

  const handleNextScene = useCallback(() => {
    const next = selectedScene + 1;
    if (next < liveSegments.length) handleSelectScene(next);
  }, [selectedScene, liveSegments.length, handleSelectScene]);

  // ── Load a saved split group into the timeline ────────────────────────────
  const handleLoadSplitToTimeline = useCallback((group: SegmentGroup) => {
    // Extract cut points = end of each segment except the last
    const cutsFromGroup = group.segments
      .slice(0, -1)
      .map((seg) => seg.end);

    setCuts(cutsFromGroup);
    setActiveGroupKey(group.createdAt);
    setSelectedScene(0);

    // Seek to start
    seekTo(0);
  }, [seekTo]);

  // ── When user manually moves cuts, clear active group key ────────────────
  // We do this via a wrapper so we can intercept setCuts from timeline
  const handleCutsChange = useCallback(
    (updater: React.SetStateAction<number[]>) => {
      setActiveGroupKey(null); // user has deviated from any saved group
      setCuts(updater);
    },
    []
  );

  // ── Split ───────────────────────────────────────────────────────────────────
  const handleSplit = async () => {
    if (!video || liveSegments.length < 2) return;
    setSplitting(true);
    setSplitError("");
    setSplitResult([]);

    try {
      const res = await fetch(`${API}/videos/${encodeURIComponent(id)}/split`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ segments: liveSegments }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Split failed");
      }
      const data = await res.json();
      setSplitResult(data.segment_urls ?? []);

      // Refresh video from DB — cuts stay as-is, but mark this group as active
      const refresh = await fetch(`${API}/videos/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (refresh.ok) {
        const refreshed: Video = await refresh.json();
        setVideo(refreshed);

        // Find the newly created group by matching cut points
        if (refreshed.segments.length > 0) {
          const groups = groupSegmentsByBatch(refreshed.segments);
          // Latest group is newest = what we just created
          setActiveGroupKey(groups[0].createdAt);
        }
      }
    } catch (e: unknown) {
      setSplitError(e instanceof Error ? e.message : "Split failed");
    } finally {
      setSplitting(false);
    }
  };

  // ── Loading / error ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen bg-[#0e0e0e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!video || error) {
    return (
      <div className="h-screen bg-[#0e0e0e] flex items-center justify-center p-8">
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-8 max-w-md text-center">
          <p className="text-red-300 text-xl font-bold mb-2">Video Not Found</p>
          <p className="text-white/40 text-sm mb-6">{error}</p>
          <Link href="/" className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentSegment = liveSegments[selectedScene];

  return (
    <div
      className="h-screen bg-[#0e0e0e] flex flex-col overflow-hidden"
      style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
    >
      {/* Top bar */}
      <TopBar
        video={video}
        splitting={splitting}
        canSplit={liveSegments.length >= 2}
        splitError={splitError}
        onSplit={handleSplit}
      />

      {/* Three-panel body */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <MediaPanel video={video} apiBase={API} />

        <ScenesPanel
          liveSegments={liveSegments}
          selectedScene={selectedScene}
          onSelectScene={handleSelectScene}
          totalDuration={video.duration ?? 0}
          savedSegments={video.segments}
          apiBase={API}
          splitResult={splitResult}
        />

        <PreviewPanel
          videoSrc={`${API}${video.video_url}`}
          videoRef={videoRef}
          onVideoReady={() => setIsVideoReady(true)}
          currentSegment={currentSegment}
          selectedScene={selectedScene}
          totalScenes={liveSegments.length}
          onPrevScene={handlePrevScene}
          onNextScene={handleNextScene}
        />
      </div>

      {/* Timeline */}
      <div className="h-44 border-t border-white/10 flex-shrink-0">
        {isVideoReady && video.duration ? (
          <VideoTimeline
            duration={video.duration}
            videoRef={videoRef}
            cuts={cuts}
            setCuts={handleCutsChange}
            onSegmentsChange={setLiveSegments}
          />
        ) : (
          <div className="flex items-center justify-center h-full gap-2">
            <div className="w-4 h-4 border border-white/20 border-t-white/60 rounded-full animate-spin" />
            <p className="text-white/20 text-xs">Waiting for video...</p>
          </div>
        )}
      </div>
    </div>
  );
}