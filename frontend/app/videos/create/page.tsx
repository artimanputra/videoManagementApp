// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";

// const API = process.env.NEXT_PUBLIC_API_URL ;

// export default function CreateVideoPage() {
//   const router = useRouter();
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [file, setFile] = useState<File | null>(null);
//   const [submitting, setSubmitting] = useState(false);
//   const [processingStatus, setProcessingStatus] = useState("");
//   const [error, setError] = useState("");

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!title || !file) {
//       setError("Title and file are required.");
//       return;
//     }
//     setSubmitting(true);
//     setError("");
//     setProcessingStatus("Preparing upload...");

//     const formData = new FormData();
//     formData.append("title", title);
//     if (description) formData.append("description", description);
//     formData.append("file", file);

//     try {
//       setProcessingStatus("Uploading video...");
//       const res = await fetch(`${API}/videos`, {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//         body: formData,
//       });
//       if (!res.ok) {
//         const data = await res.json();
//         throw new Error(data.detail || "Upload failed");
//       }
//       const video = await res.json();
//       setProcessingStatus(`Upload complete! Video status: ${video.status}`);
      
//       // Redirect to video detail page using file_id
//       setTimeout(() => {
//         router.push(`/videos/${video.id}`);
//       }, 1500);
//     } catch (err: unknown) {
//       setError(err instanceof Error ? err.message : "Upload failed");
//       setProcessingStatus("");
//     } finally {
//       setSubmitting(false);
//     }
//   };

// return (
//   <div className="min-h-screen bg-[#0b0b0b] p-8">
//     <div className="max-w-xl mx-auto space-y-6">

//       <Link href="/" className="text-sm text-white/50 hover:text-white">
//         ← Back to dashboard
//       </Link>

//       <div>
//         <h1 className="text-2xl font-semibold text-white">
//           Create Video
//         </h1>
//         <p className="text-sm text-white/40">
//           Upload and start processing a new video
//         </p>
//       </div>

//       {error && (
//         <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-lg text-sm">
//           {error}
//         </div>
//       )}

//       {processingStatus && (
//         <div className="bg-blue-500/10 border border-blue-500/30 text-blue-300 p-3 rounded-lg text-sm flex items-center gap-2">
//           <span className="animate-spin">⏳</span>
//           {processingStatus}
//         </div>
//       )}

//       <form
//         onSubmit={handleSubmit}
//         className="bg-[#111] border border-white/10 rounded-xl p-6 space-y-5"
//       >
//         <div>
//           <label className="text-xs uppercase text-white/40">Title</label>
//           <input
//             value={title}
//             onChange={(e) => setTitle(e.target.value)}
//             disabled={submitting}
//             className="mt-1 w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
//           />
//         </div>

//         <div>
//           <label className="text-xs uppercase text-white/40">
//             Description
//           </label>
//           <textarea
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//             rows={3}
//             disabled={submitting}
//             className="mt-1 w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
//           />
//         </div>

//         <div>
//           <label className="text-xs uppercase text-white/40">
//             Video File
//           </label>
//           <input
//             type="file"
//             accept="video/*"
//             onChange={(e) => setFile(e.target.files?.[0] || null)}
//             disabled={submitting}
//             className="mt-1 w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
//           />
//         </div>

//         <button
//           disabled={submitting}
//           className="w-full bg-blue-600 hover:bg-blue-700 transition rounded-lg py-2 text-sm font-medium disabled:opacity-50"
//         >
//           {submitting ? "Uploading…" : "Create Video"}
//         </button>
//       </form>
//     </div>
//   </div>
// );


// }

"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export default function CreateVideoPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [error, setError] = useState("");

  // Optional: limit size (e.g., 1GB) — change as you need
  const MAX_SIZE_BYTES = 1024 * 1024 * 1024;

  const fileLabel = useMemo(() => {
    if (!file) return "No file selected";
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return `${file.name} • ${sizeMB} MB`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?.name, file?.size]);

  const onFile = useCallback(
    (f: File | null) => {
      if (!f) {
        setFile(null);
        return;
      }
      if (f.size > MAX_SIZE_BYTES) {
        setError("File is too large. Please choose a smaller file.");
        setFile(null);
        return;
      }
      setError("");
      setFile(f);
    },
    [MAX_SIZE_BYTES]
  );

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFile(e.target.files?.[0] || null);
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("video/")) {
      onFile(f);
    } else if (f) {
      setError("Please drop a valid video file.");
    }
  };

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
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: formData,
      });

      if (!res.ok) {
        // Try to parse JSON error first, then fallback to text
        let message = "Upload failed";
        try {
          const data = await res.json();
          message = data?.detail || message;
        } catch {
          const txt = await res.text();
          if (txt) message = txt;
        }
        throw new Error(message);
      }

      const video = await res.json();
      setProcessingStatus(`Upload complete! Video status: ${video.status ?? "Queued"}`);

      setTimeout(() => {
        router.push(`/videos/${video.id}`);
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setProcessingStatus("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      {/* Page header band */}
      <div className="border-b border-[#191919] bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-white/70 hover:text-white transition"
          >
            ← Back to dashboard
          </Link>
          <div className="text-white/60 text-xs">Create Video</div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-white">Create Video</h1>
          <p className="text-sm text-white/50 mt-2">
            Upload and start processing a new video
          </p>
        </div>

        {/* Status & Error */}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {processingStatus && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <svg
              className="w-4 h-4 animate-spin text-red-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="10" strokeWidth="1.5" className="opacity-20" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="1.5" />
            </svg>
            {processingStatus}
          </div>
        )}

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#101010] border border-[#1f1f1f] rounded-2xl p-6 md:p-8 shadow-xl space-y-6"
        >
          {/* Title */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-white/50">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              placeholder="Give your video a title"
              className="mt-2 w-full bg-[#141414] border border-[#262626] focus:border-red-600/70 focus:ring-0 rounded-lg px-3 py-2.5 text-white text-sm outline-none transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-white/50">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              disabled={submitting}
              placeholder="Optional notes about this video…"
              className="mt-2 w-full bg-[#141414] border border-[#262626] focus:border-red-600/70 focus:ring-0 rounded-lg px-3 py-2.5 text-white text-sm outline-none transition resize-y"
            />
          </div>

          {/* File */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-white/50">
              Video File
            </label>

            {/* Drop area + input */}
            <label
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={onDrop}
              className="mt-2 block rounded-xl border border-dashed border-[#2a2a2a] hover:border-red-700/60 bg-[#121212] hover:bg-[#141414] transition p-5 cursor-pointer"
            >
              <div className="flex items-center gap-3 text-white/70">
                <div className="w-10 h-10 rounded bg-red-600/20 text-red-400 flex items-center justify-center shrink-0">
                  {/* Upload icon */}
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
                    />
                  </svg>
                </div>

                <div className="flex-1">
                  <div className="text-sm">
                    Drag & drop your video here, or{" "}
                    <span className="text-red-400 underline">browse</span>
                  </div>
                  <div className="text-xs text-white/40 mt-1">
                    MP4, MOV, WEBM • Max ~1 GB (configurable)
                  </div>
                </div>

                <input
                  type="file"
                  accept="video/*"
                  onChange={onFileInput}
                  disabled={submitting}
                  className="hidden"
                />
              </div>
            </label>

            {/* Selected file summary */}
            <div className="mt-2 text-xs text-white/60">
              {file ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-green-500/80" />
                  {fileLabel}
                </span>
              ) : (
                "No file selected"
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            disabled={submitting}
            className="w-full bg-red-600 hover:bg-red-700 transition rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Uploading…" : "Create Video"}
          </button>
        </form>

        {/* Tips */}
        <div className="mt-6 text-xs text-white/40 text-center">
          Your upload is secured by your account token. You can delete videos anytime.
        </div>
      </div>
    </div>
  );
}