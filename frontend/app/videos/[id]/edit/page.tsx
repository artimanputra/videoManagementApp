"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

interface Video {
  id: number;
  title: string;
  description: string | null;
  video_url: string;
  duration: number | null;
  status: string;
  created_at: string;
}

const STATUS_OPTIONS = ["Draft", "Processing", "Ready", "Failed"] as const;

export default function EditVideoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("Draft");

  // Nice readable meta
  const createdAt = useMemo(() => {
    if (!video?.created_at) return "";
    try {
      const d = new Date(video.created_at);
      return d.toLocaleString();
    } catch {
      return video.created_at;
    }
  }, [video?.created_at]);

  useEffect(() => {
    const fetchVideo = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API}/videos/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });
        if (!res.ok) throw new Error("Failed to load video");
        const data: Video = await res.json();
        setVideo(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setStatus(
          (STATUS_OPTIONS.includes(data.status as any)
            ? data.status
            : "Draft") as (typeof STATUS_OPTIONS)[number]
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load video");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchVideo();
  }, [id]);

  const handleDelete = async () => {
    const confirmed = confirm(
      "Are you sure? This will permanently delete the video."
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      const res = await fetch(`${API}/videos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (!res.ok) throw new Error("Delete failed");
      router.push("/"); // back to list (dashboard)
    } catch (err) {
      alert("Failed to delete video");
    } finally {
      setDeleting(false);
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
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`, // ✅ add auth
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          status,
        }),
      });

      if (!res.ok) {
        let message = "Update failed";
        try {
          const data = await res.json();
          message = data.detail || message;
        } catch {
          const txt = await res.text();
          if (txt) message = txt;
        }
        throw new Error(message);
      }

      const updatedVideo: Video = await res.json();
      setVideo(updatedVideo);
      setSuccess("Video updated successfully!");

      setTimeout(() => {
        router.push(`/videos/${id}`);
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Loading skeleton ----------
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center px-6">
        <div className="w-full max-w-2xl space-y-5">
          <div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
          <div className="h-8 w-72 bg-white/15 rounded animate-pulse" />
          <div className="h-64 bg-white/5 rounded-2xl border border-white/10 animate-pulse" />
        </div>
      </div>
    );
  }

  // ---------- Not found ----------
  if (!video) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center px-6">
        <div className="bg-[#141414] border border-red-500/30 rounded-2xl p-8 text-center max-w-md">
          <p className="text-red-400 font-semibold mb-4">Video not found</p>
            <Link
            href="/"
            className="text-sm text-white/70 hover:text-white transition"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ---------- Main ----------
  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      {/* Header band */}
      <div className="border-b border-[#191919] bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link
            href={`/videos/${id}`}
            className="text-sm text-white/60 hover:text-white transition"
          >
            ← Back to video
          </Link>
          <div className="text-white/60 text-xs">Edit Video</div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: form */}
        <div className="lg:col-span-3">
          {/* Alerts */}
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-lg text-sm">
              ✓ {success}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-[#101010] border border-[#1f1f1f] rounded-2xl p-6 md:p-8 shadow-xl space-y-6"
          >
            <div>
              <label className="text-[11px] uppercase tracking-wider text-white/50">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
                placeholder="Edit the title…"
                className="mt-2 w-full bg-[#141414] border border-[#262626] focus:border-red-600/70 focus:ring-0 rounded-lg px-3 py-2.5 text-white text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-white/50">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
                rows={4}
                placeholder="Optional notes…"
                className="mt-2 w-full bg-[#141414] border border-[#262626] focus:border-red-600/70 focus:ring-0 rounded-lg px-3 py-2.5 text-white text-sm outline-none transition resize-y"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-white/50">
                Status
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as (typeof STATUS_OPTIONS)[number])
                }
                disabled={submitting}
                className="mt-2 w-full bg-[#141414] border border-[#262626] focus:border-red-600/70 focus:ring-0 rounded-lg px-3 py-2.5 text-white text-sm outline-none transition"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>

              <p className="text-xs text-white/40 mt-2">
                Current:&nbsp;
                <span className="text-white">{video.status}</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                disabled={submitting}
                className="flex-1 bg-red-600 hover:bg-red-700 transition rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Saving…" : "Save Changes"}
              </button>

              <Link
                href={`/videos/${id}`}
                className="flex-1 bg-white/10 hover:bg-white/15 transition rounded-lg py-2.5 text-sm text-center"
              >
                Cancel
              </Link>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="sm:w-auto bg-red-600/80 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete this video permanently"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-xs text-white/40">
            Last updated will reflect after save. You can delete videos anytime.
          </div>
        </div>

        {/* Right: preview & meta */}
        <aside className="lg:col-span-2 space-y-4">
          <div className="bg-[#101010] border border-[#1f1f1f] rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-white/80 mb-3">
              Preview
            </h3>
            <div className="aspect-video bg-black rounded-lg overflow-hidden border border-[#222]">
              {video.video_url ? (
                <video
                  src={video.video_url}
                  controls
                  className="w-full h-full object-cover"
                  preload="metadata"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">
                  No preview available
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#101010] border border-[#1f1f1f] rounded-2xl p-4 text-sm text-white/70">
            <div className="flex items-center justify-between py-2 border-b border-[#1d1d1d]">
              <span className="text-white/50">ID</span>
              <span className="font-mono text-white/80">{video.id}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#1d1d1d]">
              <span className="text-white/50">Created</span>
              <span>{createdAt || "—"}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-white/50">Duration</span>
              <span>{video.duration ? `${Math.round(video.duration)}s` : "—"}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}