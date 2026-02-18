import Link from "next/link";

export default function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="bg-[#141414] border border-[#222] rounded-xl p-10 text-center">
      <div className="text-4xl mb-4">🎥</div>

      <h3 className="text-lg font-semibold mb-2">
        {hasFilters ? "No videos found" : "No videos yet"}
      </h3>

      <p className="text-sm text-gray-400 mb-6">
        {hasFilters
          ? "Try changing your search or filters."
          : "Get started by uploading your first video."}
      </p>

      <Link
        href="/videos/create"
        className="inline-flex items-center gap-2
                   bg-red-600 hover:bg-red-700
                   px-5 py-2.5 rounded-lg
                   text-md font-medium transition"
      >
        ➕ Create Video
      </Link>
    </div>
  );
}