"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ;
interface Video {
  id: number;
  title: string;
  description: string | null;
  video_url: string;
  duration: number | null;
  status: string;
  created_at: string;
}

const STATUS_OPTIONS = ["Draft", "Processing", "Ready", "Failed"];

export default function EditVideoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Draft");

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await fetch(`${API}/videos/${id}`);
        if (!res.ok) throw new Error("Failed to load video");
        const data: Video = await res.json();
        setVideo(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setStatus(data.status);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load video");
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API}/videos/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Update failed");
      }

      const updatedVideo: Video = await res.json();
      setVideo(updatedVideo);
      setSuccess("Video updated successfully!");

      // Redirect to detail page after 1.5 seconds
      setTimeout(() => {
        router.push(`/videos/${id}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-lg mx-auto">
          <p className="text-gray-500">Loading video...</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-lg mx-auto">
          <p className="text-red-600">Video not found</p>
          <Link href="/" className="text-blue-600 hover:underline text-sm mt-4">
            Back to list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-lg mx-auto">
        <Link
          href={`/videos/${id}`}
        className="text-blue-400 hover:text-blue-300 text-sm"
        >
          &larr; Back to video
        </Link>

        <h1 className="text-3xl font-bold text-white mt-4 mb-6">
          Edit Video
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm flex items-center">
            <span className="mr-2">✓</span>
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-slate-800/80 backdrop-blur border border-slate-700 p-6 rounded-lg shadow-lg"
        >
    <div>
            <label className="block text-sm font-medium text-white  mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Current status: <span className="font-semibold">{video.status}</span>
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 flex-1"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
            <Link
              href={`/videos/${id}`}
            className="bg-slate-600 hover:bg-slate-500 text-white px-6 py-2 rounded-lg text-sm flex items-center justify-center"
          >
              Cancel
            </Link>
          </div>
        </form>

        <div className="mt-6 bg-blue-50 p-4 rounded border border-blue-200 text-sm text-blue-800">
          <p className="font-medium mb-2">Video Info</p>
          <p>ID: <span className="font-mono">{video.id}</span></p>
          <p>URL: <span className="font-mono text-xs">{video.video_url}</span></p>
          {video.duration && <p>Duration: {video.duration}s</p>}
          <p>Created: {new Date(video.created_at).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
