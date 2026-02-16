"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ;

interface Video {
  id: number;
  file_id: string;
  title: string;
  description: string | null;
  video_url: string;
  duration: number | null;
  status: string;
  created_at: string;
  segments: VideoSegment[];
}

interface VideoSegment {
  id: number;
  start: number;
  end: number;
  segment_url: string;
  created_at: string;
}

interface Segment {
  start: number;
  end: number;
}

export default function VideoDetail() {
  const params = useParams();
  const id = params.id as string;
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [segments, setSegments] = useState<Segment[]>([{ start: 0, end: 5 }]);
  const [splitResult, setSplitResult] = useState<string[]>([]);
  const [splitting, setSplitting] = useState(false);
  const [error, setError] = useState("");
  const [splitError, setSplitError] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [backendStatus, setBackendStatus] = useState<any>(null);

  useEffect(() => {
    // Load video
    fetch(`${API}/videos/${encodeURIComponent(id)}`)
      .then((r) => {
        if (!r.ok) {
          throw new Error(`Video not found (HTTP ${r.status}). Video file ${id} does not exist.`);
        }
        return r.json();
      })
      .then((data) => {
        console.log("Video loaded:", data);
        setVideo(data);
      })
      .catch((err) => {
        console.error("Failed to load video:", err);
        setError(err.message || "Failed to load video. Please check if the video exists.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const addSegment = () => {
    const lastSegment = segments[segments.length - 1];
    setSegments([...segments, { start: lastSegment.end, end: lastSegment.end + 5 }]);
  };

  const removeSegment = (idx: number) => {
    setSegments(segments.filter((_, i) => i !== idx));
  };

  const updateSegment = (idx: number, field: "start" | "end", value: number) => {
    const updated = [...segments];
    updated[idx][field] = Math.max(0, Math.min(value, video?.duration || 0));
    setSegments(updated);
  };

  const handleSplit = async () => {
    setSplitting(true);
    setSplitError("");
    setSplitResult([]);
    try {
      const res = await fetch(`${API}/videos/${encodeURIComponent(id)}/split`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segments }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Split failed");
      }
      const data = await res.json();
      setSplitResult(data.segment_urls);
      const vRes = await fetch(`${API}/videos/${encodeURIComponent(id)}`);
      setVideo(await vRes.json());
    } catch (e: unknown) {
      setSplitError(e instanceof Error ? e.message : "Split failed");
    } finally {
      setSplitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getFileSize = () => {
    if (!video?.video_url) return "-";
    // Extract filename from URL
    const filename = video.video_url.split("/").pop() || "";
    return filename;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-gray-400 animate-pulse">Loading video...</p>
        </div>
      </div>
    );
  }

  if (!video || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-6 rounded-lg">
            <p className="font-bold text-lg mb-2">❌ Video Not Found</p>
            <p className="mb-4">{error || "Video not found"}</p>
            <div className="bg-red-800/50 p-4 rounded mb-4 text-sm">
              <p className="font-semibold mb-2">What to do:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Upload a video first from the home page</li>
                <li>Check the correct video ID in the URL</li>
                <li>Make sure the backend is running and accessible</li>
              </ul>
            </div>
            {backendStatus && (
              <div className="bg-green-800/50 p-3 rounded text-sm mb-4">
                <p className="font-semibold">✓ Backend Status:</p>
                <p>URL: {API}</p>
                <p>Videos stored: {backendStatus.videos_count}</p>
              </div>
            )}
          </div>
          <Link href="/" className="text-blue-400 hover:underline text-sm mt-6 inline-block">
            ← Go back and upload a video
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
            ← Back to list
          </Link>
          <Link
            href={`/videos/${id}/edit`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            ✎ Edit Metadata
          </Link>
        </div>
       
        {/* Title and Status */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">{video.title}</h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                video.status === "Ready"
                  ? "bg-green-500/20 text-green-300"
                  : video.status === "Processing"
                  ? "bg-yellow-500/20 text-yellow-300"
                  : video.status === "Uploading"
                  ? "bg-blue-500/20 text-blue-300"
                  : video.status === "Failed"
                  ? "bg-red-500/20 text-red-300"
                  : "bg-gray-500/20 text-gray-300"
              }`}
            >
              {video.status}
            </span>
          </div>
          {video.description && (
            <p className="text-gray-400 text-sm">{video.description}</p>
          )}
        </div>

        {/* Video Information Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Duration</p>
            <p className="text-white text-lg font-bold">
              {video.duration ? formatTime(video.duration) : "-"}
            </p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <p className="text-gray-500 text-xs font-semibold uppercase mb-1">File Type</p>
            <p className="text-white text-lg font-bold">MP4</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Status</p>
            <p className="text-white text-lg font-bold">{video.status}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Created</p>
            <p className="text-white text-sm font-bold">
              {new Date(video.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Split Video Section */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-2xl">✂️</span>Split Video
          </h2>

          {splitError && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-sm">
              {splitError}
            </div>
          )}

          {/* Segments */}
          <div className="space-y-6 mb-6">
            {segments.map((seg, idx) => (
              <div key={idx} className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-white">Segment {idx + 1}</h3>
                  {segments.length > 1 && (
                    <button
                      onClick={() => removeSegment(idx)}
                      className="text-red-400 hover:text-red-300 text-sm font-medium"
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>

                {/* Timeline Display */}
                <div className="bg-slate-900 rounded-lg p-6 mb-6">
                  {/* Top Labels */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center flex-1">
                      <p className="text-gray-500 text-xs uppercase">START</p>
                      <p className="text-white text-2xl font-bold font-mono">{formatTime(seg.start)}</p>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-blue-400 text-xs uppercase">DURATION</p>
                      <p className="text-blue-300 text-2xl font-bold font-mono bg-blue-600/20 px-4 py-2 rounded-lg">
                        {formatTime(seg.end - seg.start)}
                      </p>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-gray-500 text-xs uppercase">END</p>
                      <p className="text-white text-2xl font-bold font-mono">{formatTime(seg.end)}</p>
                    </div>
                  </div>

                  {/* Timeline Slider */}
                  <div className="relative mt-6 h-10">
                    {/* Background track */}
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-600 rounded -translate-y-1/2 pointer-events-none" />

                    {/* Active segment */}
                    <div
                      className="absolute top-1/2 h-1 bg-blue-500 rounded -translate-y-1/2 pointer-events-none"
                      style={{
                        left: `${(seg.start / (video.duration || 1)) * 100}%`,
                        width: `${((seg.end - seg.start) / (video.duration || 1)) * 100}%`,
                      }}
                    />

                    {/* START handle */}
                    <input
                      type="range"
                      min={0}
                      max={video.duration || 0}
                      step="0.1"
                      value={seg.start}
                      onChange={(e) => {
                        const val = Math.min(Number(e.target.value), seg.end - 0.1);
                        updateSegment(idx, "start", val);
                      }}
                      className="range-thumb"
                      style={{ zIndex: seg.start > seg.end - 1 ? 5 : 6 }}
                    />

                    {/* END handle */}
                    <input
                      type="range"
                      min={0}
                      max={video.duration || 0}
                      step="0.1"
                      value={seg.end}
                      onChange={(e) => {
                        const val = Math.max(Number(e.target.value), seg.start + 0.1);
                        updateSegment(idx, "end", val);
                      }}
                      className="range-thumb"
                      style={{ zIndex: 5 }}
                    />
                  </div>

                  {/* Time inputs below timeline */}
                  <div className="grid grid-cols-3 gap-4 mt-8">
                    <div>
                      <label className="text-gray-400 text-xs mb-2 block">START TIME</label>
                      <input
                        type="number"
                        step="0.1"
                        value={seg.start}
                        onChange={(e) => {
                          const newStart = Math.min(parseFloat(e.target.value), seg.end - 0.1);
                          updateSegment(idx, "start", newStart);
                        }}
                        className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white text-sm font-mono"
                      />
                      <p className="text-gray-400 text-xs mt-1">{formatTime(seg.start)}</p>
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs mb-2 block">DURATION</label>
                      <div className="bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white text-sm font-mono">
                        {formatTime(seg.end - seg.start)}
                      </div>
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs mb-2 block">END TIME</label>
                      <input
                        type="number"
                        step="0.1"
                        value={seg.end}
                        onChange={(e) => {
                          const newEnd = Math.max(parseFloat(e.target.value), seg.start + 0.1);
                          updateSegment(idx, "end", newEnd);
                        }}
                        className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white text-sm font-mono"
                      />
                      <p className="text-gray-400 text-xs mt-1">{formatTime(seg.end)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={addSegment}
              className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              + Add Segment
            </button>
            <button
              onClick={handleSplit}
              disabled={splitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg text-sm font-semibold transition"
            >
              {splitting ? "Processing..." : "🎬 Split Video"}
            </button>
          </div>

          {/* Split Results */}
          {splitResult.length > 0 && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6">
              <h3 className="text-green-300 font-semibold mb-3 flex items-center gap-2">
                <span>✓</span> Segments Created Successfully
              </h3>
              <div className="space-y-2">
                {splitResult.map((url, i) => (
                  <a
                    key={i}
                    href={`${API}${url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 hover:text-green-300 text-xs truncate block"
                  >
                    Segment {i + 1}: {url}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Saved Segments */}
          {video.segments && video.segments.length > 0 && (
            <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span>📁</span> Saved Segments
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {video.segments.map((seg, i) => (
                  <a
                    key={seg.id}
                    href={`${API}${seg.segment_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-600 hover:bg-slate-500 rounded-lg p-3 border border-slate-500 transition group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold">
                          Segment {i + 1}: {formatTime(seg.start)} - {formatTime(seg.end)}
                        </p>
                        <p className="text-gray-500 text-xs mt-1 group-hover:text-gray-400">
                          Duration: {formatTime(seg.end - seg.start)}
                        </p>
                      </div>
                      <span className="text-gray-400 group-hover:text-gray-300">↗</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
