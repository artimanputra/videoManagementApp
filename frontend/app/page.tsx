"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API = "http://localhost:8000";

interface Video {
  id: number;
  file_id: string;
  title: string;
  description: string | null;
  video_url: string;
  duration: number | null;
  status: string;
  created_at: string;
}

interface ListResponse {
  items: Video[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "Uploading", label: "Uploading" },
  { value: "Draft", label: "Draft" },
  { value: "Processing", label: "Processing" },
  { value: "Ready", label: "Ready" },
  { value: "Failed", label: "Failed" },
];

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  const fetchVideos = async (newPage: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", newPage.toString());
      params.set("size", size.toString());
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      
      const res = await fetch(`${API}/videos?${params}`);
      const data: ListResponse = await res.json();
      setVideos(data.items);
      setTotal(data.total);
      setPages(data.pages);
      setPage(newPage);
    } catch (error) {
      console.error("Failed to fetch videos", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos(1);
  }, []);

  const handleSearch = () => {
    fetchVideos(1);
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    setPage(1);
    
    // Fetch with the new status value
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("size", size.toString());
      if (search) params.set("search", search);
      if (newStatus) params.set("status", newStatus);
      
      const res = await fetch(`${API}/videos?${params}`);
      const data: ListResponse = await res.json();
      setVideos(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (error) {
      console.error("Failed to fetch videos", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      fetchVideos(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < pages) {
      fetchVideos(page + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Videos</h1>
          <Link
            href="/videos/create"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
          >
            + New Video
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-6 bg-white p-4 rounded border">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded px-3 py-2 flex-1 text-sm text-black"
            />
            <button
              onClick={handleSearch}
              className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-900"
            >
              Search
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              value={status}
              onChange={handleStatusChange}
              className="border rounded px-3 py-2 w-full text-sm text-black"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Info */}
        {total > 0 && (
          <p className="text-sm text-gray-600 mb-4">
            Showing {(page - 1) * size + 1} to {Math.min(page * size, total)} of {total} videos
          </p>
        )}

        {/* Video List */}
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : videos.length === 0 ? (
          <p className="text-gray-500">No videos found.</p>
        ) : (
          <>
            <ul className="space-y-3 mb-6">
              {videos.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/videos/${v.file_id}`}
                    className="block border rounded p-4 bg-white hover:shadow transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{v.title}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded font-semibold ${
                          v.status === "Ready"
                            ? "bg-green-100 text-green-700"
                            : v.status === "Processing"
                            ? "bg-yellow-100 text-yellow-700"
                            : v.status === "Failed"
                            ? "bg-red-100 text-red-700"
                            : v.status === "Uploading"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>
                    {v.description && (
                      <p className="text-sm text-gray-500 mt-1">{v.description}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between border-t pt-4">
                <button
                  onClick={handlePrevPage}
                  disabled={page === 1}
                  className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {pages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={page === pages}
                  className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
