"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`${API}/videos?${params}`);
      const data = await res.json();
      setVideos(data.items);
    } catch {
      console.error("Failed to fetch videos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

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

        {/* Search */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-2 flex-1 text-sm"
          />
          <button
            onClick={fetchVideos}
            className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-900"
          >
            Search
          </button>
        </div>

        {/* Video List */}
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : videos.length === 0 ? (
          <p className="text-gray-500">No videos found.</p>
        ) : (
          <ul className="space-y-3">
            {videos.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/videos/${v.id}`}
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
        )}
      </div>
    </div>
  );
}
