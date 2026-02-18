export default function SkeletonRow() {
  return (
    <div className="bg-[#141414] border border-[#222] rounded-lg p-4 animate-pulse">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-4 w-48 bg-[#2a2a2a] rounded"></div>
          <div className="h-3 w-64 bg-[#2a2a2a] rounded"></div>
        </div>
        <div className="h-6 w-20 bg-[#2a2a2a] rounded-full"></div>
      </div>
    </div>
  );
}