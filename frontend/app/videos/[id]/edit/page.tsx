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
        const res = await fetch(`${API}/videos/${id}`,{
          headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        });
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

  
const handleDelete = async () => {
  const confirmed = confirm(
    "Are you sure? This will permanently delete the video."
  );
  if (!confirmed) return;

  try {
    const res = await fetch(`${API}/videos/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!res.ok) throw new Error("Delete failed");

    router.push("/"); // back to list
  } catch (err) {
    alert("Failed to delete video");
  }
};

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
    <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
      <div className="w-full max-w-lg space-y-4 animate-pulse">
        <div className="h-4 w-32 bg-white/10 rounded" />
        <div className="h-8 w-64 bg-white/15 rounded" />
        <div className="h-48 bg-white/5 rounded-xl border border-white/10" />
      </div>
    </div>
  );
}


  if (!video) {
  return (
    <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
      <div className="bg-[#141414] border border-red-500/30 rounded-xl p-8 text-center">
        <p className="text-red-400 font-semibold mb-4">Video not found</p>
        <Link href="/" className="text-sm text-white/60 hover:text-white">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}


 return (
  <div className="min-h-screen bg-[#0b0b0b] p-8">
    <div className="max-w-xl mx-auto space-y-6">

      <Link
        href={`/videos/${id}`}
        className="text-sm text-white/50 hover:text-white transition"
      >
        ← Back to video
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Edit Video
        </h1>
        <p className="text-sm text-white/40">
          Update metadata and publishing status
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-lg text-sm">
          ✓ {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-[#111] border border-white/10 rounded-xl p-6 space-y-5"
      >
        {/* Title */}
        <div>
          <label className="text-xs uppercase tracking-wide text-white/40">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={submitting}
            className="mt-1 w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs uppercase tracking-wide text-white/40">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
            rows={4}
            className="mt-1 w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Status */}
        <div>
          <label className="text-xs uppercase tracking-wide text-white/40">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={submitting}
            className="mt-1 w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>

          <p className="text-xs text-white/40 mt-1">
            Current: <span className="text-white">{video.status}</span>
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            disabled={submitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 transition rounded-lg py-2 text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save"}
          </button>

          <Link
            href={`/videos/${id}`}
            className="flex-1 bg-white/10 hover:bg-white/15 transition rounded-lg py-2 text-sm text-center"
          >
            Cancel
          </Link> 
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-600/80 hover:bg-red-600 
                      text-white px-4 py-2 rounded-lg text-sm
                      transition"
          >
            Delete Video
          </button>
        </div>
      </form>
    </div>
  </div>
);

}
