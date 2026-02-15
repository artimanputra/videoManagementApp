"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API = "http://localhost:8000";

interface Video {
  id: number;
  title: string;
  description: string | null;
  video_url: string;
  duration: number | null;
  status: string;
  created_at: string;
}

interface Segment {
  start: string;
  end: string;
}

export default function VideoDetail() {
  const params = useParams();
  const id = params.id;

  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [segments, setSegments] = useState<Segment[]>([{ start: "0", end: "5" }]);
  const [splitResult, setSplitResult] = useState<string[]>([]);
  const [splitting, setSplitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/videos/${id}`)
      .then((r) => r.json())
      .then((data) => setVideo(data))
      .catch(() => setError("Failed to load video"))
      .finally(() => setLoading(false));
  }, [id]);

  const addSegment = () => {
    setSegments([...segments, { start: "0", end: "5" }]);
  };

  const removeSegment = (idx: number) => {
    setSegments(segments.filter((_, i) => i !== idx));
  };

  const updateSegment = (idx: number, field: "start" | "end", value: string) => {
    const updated = [...segments];
    updated[idx][field] = value;
    setSegments(updated);
  };

  const handleSplit = async () => {
    setSplitting(true);
    setError("");
    setSplitResult([]);
    try {
      const body = {
        segments: segments.map((s) => ({
          start: parseFloat(s.start),
          end: parseFloat(s.end),
        })),
      };
      const res = await fetch(`${API}/videos/${id}/split`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Split failed");
      }
      const data = await res.json();
      setSplitResult(data.segment_urls);
      // Refresh video to get updated status
      const vRes = await fetch(`${API}/videos/${id}`);
      setVideo(await vRes.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Split failed");
    } finally {
      setSplitting(false);
    }
  };

  if (loading) return <p className="p-8 text-gray-500">Loading...</p>;
  if (!video) return <p className="p-8 text-red-500">Video not found.</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-blue-600 text-sm hover:underline">
          &larr; Back to list
        </Link>

        {/* Video Info */}
        <div className="mt-4 border rounded p-6 bg-white">
          <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>
          <div className="mt-3 space-y-1 text-sm text-gray-600">
            <p>
              <span className="font-medium">Status:</span>{" "}
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  video.status === "Ready"
                    ? "bg-green-100 text-green-700"
                    : video.status === "Processing"
                    ? "bg-yellow-100 text-yellow-700"
                    : video.status === "Failed"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {video.status}
              </span>
            </p>
            {video.description && (
              <p>
                <span className="font-medium">Description:</span> {video.description}
              </p>
            )}
            {video.duration !== null && (
              <p>
                <span className="font-medium">Duration:</span> {video.duration}s
              </p>
            )}
            <p>
              <span className="font-medium">Created:</span>{" "}
              {new Date(video.created_at).toLocaleString()}
            </p>
            <p>
              <span className="font-medium">URL:</span> {video.video_url}
            </p>
          </div>
        </div>

        {/* Split Section */}
        <div className="mt-6 border rounded p-6 bg-white">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Split Video</h2>

          {segments.map((seg, idx) => (
            <div key={idx} className="flex items-center gap-3 mb-2">
              <span className="text-sm text-gray-500 w-20">Segment {idx + 1}</span>
              <input
                type="number"
                step="0.1"
                placeholder="Start (s)"
                value={seg.start}
                onChange={(e) => updateSegment(idx, "start", e.target.value)}
                className="border rounded px-2 py-1 w-28 text-sm"
              />
              <span className="text-gray-400">to</span>
              <input
                type="number"
                step="0.1"
                placeholder="End (s)"
                value={seg.end}
                onChange={(e) => updateSegment(idx, "end", e.target.value)}
                className="border rounded px-2 py-1 w-28 text-sm"
              />
              {segments.length > 1 && (
                <button
                  onClick={() => removeSegment(idx)}
                  className="text-red-500 text-sm hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <div className="flex gap-3 mt-4">
            <button
              onClick={addSegment}
              className="text-sm text-blue-600 hover:underline"
            >
              + Add Segment
            </button>
            <button
              onClick={handleSplit}
              disabled={splitting}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {splitting ? "Splitting..." : "Split Video"}
            </button>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          {splitResult.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Split Segments Result
              </h3>
              <ul className="space-y-1">
                {splitResult.map((url, i) => (
                  <li key={i} className="text-sm text-gray-600 bg-gray-50 rounded px-3 py-2">
                    Segment {i + 1}: <span className="font-mono text-xs">{url}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
