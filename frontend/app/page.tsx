"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import SkeletonRow from "./components/SkeletonRow";
import EmptyState from "./components/EmptyState";

const API = process.env.NEXT_PUBLIC_API_URL;

interface Video {
  id: number;
  title: string;
  description: string | null;
  status: string;
}

interface ListResponse {
  items: Video[];
  pages: number;
}

const STATUS_OPTIONS = ["", "Uploading", "Draft", "Processing", "Ready", "Failed"];

export default function Dashboard() {
  const router = useRouter();

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);

  const logout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const fetchVideos = async (newPage = 1) => {
    setLoading(true);

    const params = new URLSearchParams({
      page: newPage.toString(),
      size: "10",
    });
    if (search) params.set("search", search);
    if (status) params.set("status", status);

    const res = await fetch(`${API}/videos?${params}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data: ListResponse = await res.json();
    setVideos(data.items);
    setPages(data.pages);
    setPage(newPage);
    setLoading(false);
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
      return;
    }
    fetchVideos();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0b0b0b] text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0f0f0f] border-r border-[#222] p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-8">
          🎬 Video Manager
        </h2>

        <nav className="flex-1 space-y-4">
          <Link
            href="/"
            className="block px-3 py-2 rounded bg-[#1a1a1a] text-md font-semibold"
          >
            Dashboard
          </Link>
          <Link
            href="/videos/create"
            className="block px-3 py-2 rounded  text-md font-semibold  bg-red-500 hover:bg-red-700 transition"
          >
            + New Video
          </Link>
        </nav>

        <button
          onClick={logout}
          className="mt-auto px-3 py-2 rounded bg-[#a90d0d] hover:bg-[#2a2a2a] text-sm"
        >
          Logout
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8">
        {/* Filters */}
        <div className="bg-[#141414] border border-[#222] rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">            
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                fetchVideos(1);
              }}
              className="bg-[#0f0f0f] border border-[#2a2a2a] rounded px-3 py-2 text-sm focus:border-red-500 outline-none"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="focus:border-red-500">
                  {s || "All Status"}
                </option>
              ))}
            </select>

            <input
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#0f0f0f] border border-[#2a2a2a] rounded px-3 py-2 text-sm focus:border-red-500 outline-none"
            />

            <button
              onClick={() => fetchVideos(1)}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 rounded px-4 py-2 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
                Search
            </button>
          </div>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading && (
          Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))
        )}

        {!loading && videos.length === 0 && (
          <EmptyState hasFilters={!!search || !!status} />
        )}

        {!loading && videos.map((v) => (
        <Link
          key={v.id}
          href={`/videos/${v.id}`}
          onClick={() => setLoading(true)}
          className="group bg-[#141414] border border-[#222] rounded-xl overflow-hidden
                    hover:border-red-500 transition shadow-lg"
        >
          {/* Thumbnail */}
          <div className="relative aspect-video bg-black">
            <video
              src={`${API}${(v as any).video_url}`}
              muted
              preload="metadata"
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100"
            />

            {/* Status badge */}
            <span
              className={`absolute top-2 right-2 text-xs px-3 py-1 rounded-full backdrop-blur ${
                v.status === "Ready"
                  ? "bg-green-900/80 text-green-300"
                  : v.status === "Processing"
                  ? "bg-yellow-900/80 text-yellow-300"
                  : v.status === "Failed"
                  ? "bg-red-900/80 text-red-300"
                  : "bg-gray-800/80 text-gray-300"
              }`}
            >
              {v.status}
            </span>
          </div>

          {/* Content */}
          <div className="p-4 space-y-2">
            <h3 className="font-semibold text-sm truncate">
              {v.title}
            </h3>

            {v.description && (
              <p className="text-xs text-gray-400 line-clamp-2">
                {v.description}
              </p>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-gray-500">
                Click to open
              </span>

              <span className="text-red-400 text-xs group-hover:translate-x-1 transition">
                →
              </span>
            </div>
          </div>
        </Link>
))}

      </div>
        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-between mt-8">
            <button
              disabled={page === 1}
              onClick={() => fetchVideos(page - 1)}
              className="px-4 py-2 rounded bg-[#1a1a1a] disabled:opacity-50"
            >
              ← Prev
            </button>
            <button
              disabled={page === pages}
              onClick={() => fetchVideos(page + 1)}
              className="px-4 py-2 rounded bg-[#1a1a1a] disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

