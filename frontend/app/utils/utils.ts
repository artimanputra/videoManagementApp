export function formatTimeLong(sec: number): string {
  if (!sec || isNaN(sec)) return "00:00:00.000";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

export function formatTimeShort(sec: number): string {
  if (!sec || isNaN(sec)) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Group VideoSegments by their created_at timestamp (same batch = same split operation)
export function groupSegmentsByBatch<T extends { created_at: string }>(
  segments: T[]
): Array<{ createdAt: string; segments: T[] }> {
  const map = new Map<string, T[]>();
  for (const seg of segments) {
    const key = seg.created_at;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(seg);
  }
  return Array.from(map.entries())
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    .map(([createdAt, segs]) => ({ createdAt, segments: segs }));
}