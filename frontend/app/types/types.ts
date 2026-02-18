export interface VideoSegment {
  id: string;
  start: number;
  end: number;
  segment_url: string;
  created_at: string;
}

export interface Video {
  id: string;
  file_id?: string;
  title: string;
  description: string | null;
  video_url: string;
  duration: number | null;
  status: string;
  created_at: string;
  segments: VideoSegment[];
}

export interface Segment {
  start: number;
  end: number;
}

// Groups of segments saved in one split operation (same created_at)
export interface SegmentGroup {
  createdAt: string;
  segments: VideoSegment[];
}