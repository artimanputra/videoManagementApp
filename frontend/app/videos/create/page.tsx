"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ;

export default function CreateVideoPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file) {
      setError("Title and file are required.");
      return;
    }
    setSubmitting(true);
    setError("");
    setProcessingStatus("Preparing upload...");

    const formData = new FormData();
    formData.append("title", title);
    if (description) formData.append("description", description);
    formData.append("file", file);

    try {
      setProcessingStatus("Uploading video...");
      const res = await fetch(`${API}/videos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Upload failed");
      }
      const video = await res.json();
      setProcessingStatus(`Upload complete! Video status: ${video.status}`);
      
      // Redirect to video detail page using file_id
      setTimeout(() => {
        router.push(`/videos/${video.id}`);
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setProcessingStatus("");
    } finally {
      setSubmitting(false);
    }
  };

return (
  <div className="min-h-screen bg-[#0b0b0b] p-8">
    <div className="max-w-xl mx-auto space-y-6">

      <Link href="/" className="text-sm text-white/50 hover:text-white">
        ← Back to dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-white">
          Create Video
        </h1>
        <p className="text-sm text-white/40">
          Upload and start processing a new video
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {processingStatus && (
        <div className="bg-blue-500/10 border border-blue-500/30 text-blue-300 p-3 rounded-lg text-sm flex items-center gap-2">
          <span className="animate-spin">⏳</span>
          {processingStatus}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-[#111] border border-white/10 rounded-xl p-6 space-y-5"
      >
        <div>
          <label className="text-xs uppercase text-white/40">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={submitting}
            className="mt-1 w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>

        <div>
          <label className="text-xs uppercase text-white/40">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            disabled={submitting}
            className="mt-1 w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>

        <div>
          <label className="text-xs uppercase text-white/40">
            Video File
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={submitting}
            className="mt-1 w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>

        <button
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 transition rounded-lg py-2 text-sm font-medium disabled:opacity-50"
        >
          {submitting ? "Uploading…" : "Create Video"}
        </button>
      </form>
    </div>
  </div>
);


}
