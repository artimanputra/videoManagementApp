from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4
from datetime import datetime
import os

from .db import get_db, init_db
from .models import Video, VideoSegment
from .schemas import VideoCreate, VideoOut
from . import storage
from .schemas import VideoUpdate, SplitRequest, SplitResult
from sqlalchemy import select, update, func, delete
import tempfile
import subprocess
from fastapi import Query
from typing import List
from fastapi.responses import JSONResponse
from pathlib import Path

app = FastAPI()

@app.get("/videos/{file_id}", response_model=VideoOut)
async def get_video(file_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Video).where(Video.file_id == file_id))
    video = res.scalars().first()
    if not video:
        raise HTTPException(status_code=404, detail="video not found")
    return video


@app.patch("/videos/{file_id}", response_model=VideoOut)
async def update_video(file_id: str, payload: VideoUpdate, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Video).where(Video.file_id == file_id))
    video = res.scalars().first()
    if not video:
        raise HTTPException(status_code=404, detail="video not found")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(video, field, value)
    db.add(video)
    await db.commit()
    await db.refresh(video)
    return video


@app.post("/videos/{file_id}/split", response_model=SplitResult)
async def split_video(file_id: str, payload: SplitRequest, db: AsyncSession = Depends(get_db)):
    # Fetch video
    res = await db.execute(select(Video).where(Video.file_id == file_id))
    video = res.scalars().first()
    if not video:
        raise HTTPException(status_code=404, detail="video not found")

    # mark processing
    video.status = "Processing"
    await db.commit()
    await db.refresh(video)

    # Determine source key from video_url (for local, just strip /videos/ prefix)
    src_key = video.video_url
    if src_key.startswith("/videos/"):
        src_key = src_key[len("/videos/"):]

    segment_urls: List[str] = []
    new_segments: List[VideoSegment] = []

    # Download source file
    with tempfile.TemporaryDirectory() as tmpdir:
        local_src = Path(tmpdir) / "source"
        try:
            storage.download_to_file(src_key, str(local_src))
        except Exception as exc:
            video.status = "Failed"
            await db.merge(video)
            await db.commit()
            raise HTTPException(status_code=500, detail=f"download failed: {exc}")

        # For each segment, run ffmpeg to extract and upload
        for idx, seg in enumerate(payload.segments):
            out_path = Path(tmpdir) / f"segment_{idx}.mp4"
            start = seg.start
            end = seg.end
            # ffmpeg command: -ss START -to END -i input -c copy
            cmd = [
                "ffmpeg",
                "-y",
                "-ss",
                str(start),
                "-to",
                str(end),
                "-i",
                str(local_src),
                "-c",
                "copy",
                str(out_path),
            ]
            try:
                # run in threadpool to avoid blocking
                await run_in_threadpool(subprocess.run, cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            except Exception as exc:
                video.status = "Failed"
                await db.merge(video)
                await db.commit()
                raise HTTPException(status_code=500, detail=f"ffmpeg failed: {exc}")

            # upload segment (use file_id instead of numeric video_id)
            seg_key = f"{file_id.split('.')[0]}_segment_{uuid4().hex}_seg{idx}.mp4"
            try:
                with open(out_path, "rb") as f:
                    await run_in_threadpool(storage.upload_file_multipart, f, seg_key)
            except Exception as exc:
                video.status = "Failed"
                await db.merge(video)
                await db.commit()
                raise HTTPException(status_code=500, detail=f"upload segment failed: {exc}")

            segment_url = storage.get_public_url(seg_key)
            segment_urls.append(segment_url)
            
            # Create new segment object (don't add to session yet)
            video_segment = VideoSegment(
                id=uuid4().hex,  # Use hex string for segment id
                video_id=video.id,
                start=start,
                end=end,
                segment_url=segment_url,
            )
            new_segments.append(video_segment)

    # Delete old segments and add new ones in a single transaction
    await db.execute(
        delete(VideoSegment).where(VideoSegment.video_id == video.id)
    )
    
    # Add all new segments
    for seg in new_segments:
        db.add(seg)
    
    # Update video status to Ready
    video.status = "Ready"
    await db.merge(video)
    
    # Commit everything at once
    await db.commit()

    return {"segment_urls": segment_urls}


# Mount videos directory for serving video files
# This must come AFTER all /videos/* API routes to avoid conflicts
VIDEOS_DIR = Path(__file__).parent / "videos"
VIDEOS_DIR.mkdir(exist_ok=True)
app.mount("/videos", StaticFiles(directory=VIDEOS_DIR), name="videos")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Custom middleware to add CORS headers to ALL responses including static files
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class CORSMiddlewareForStaticFiles(BaseHTTPMiddleware):
    """Add CORS headers to all responses including static file responses."""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # Add CORS headers to all responses including static files
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS, POST, PUT, PATCH, DELETE"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response


# Add custom CORS middleware AFTER the main CORS middleware
# This ensures CORS headers are added to ALL responses including static file responses
app.add_middleware(CORSMiddlewareForStaticFiles)

# IMPORTANT: API routes must be defined BEFORE the StaticFiles mount
# to avoid StaticFiles catching API requests

# API routes for videos

@app.on_event("startup")
async def on_startup():
    await init_db()


@app.get("/health")
async def health_check():
    """Health check endpoint to verify backend is running."""
    return {
        "status": "ok",
        "videos_dir": str(VIDEOS_DIR),
        "videos_dir_exists": VIDEOS_DIR.exists(),
        "videos_count": len(list(VIDEOS_DIR.glob("*.*"))) if VIDEOS_DIR.exists() else 0
    }


@app.post("/videos", response_model=VideoOut)
async def create_video(
    title: str = Form(...),
    description: str | None = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Accepts a multipart upload and stores the file to local videos directory.
    Starts with 'Uploading' status and transitions to 'Draft' when complete.
    Automatically calculates video duration.
    """
    # prepare key
    filename = os.path.basename(file.filename)
    key = f"{uuid4().hex}_{filename}"

    # Local file path as URL
    video_url = f"/videos/{key}"

    # insert into DB with "Uploading" status
    video = Video(
        id=uuid4().hex,  # Use hex string for video id
        file_id=key,  # Store unique file identifier
        title=title,
        description=description,
        video_url=video_url,
        duration=None,  # Will be calculated
        status="Uploading",
        created_at=datetime.utcnow(),
    )
    db.add(video)
    await db.commit()
    await db.refresh(video)

    # Save file to local videos directory
    video_path = None
    try:
        video_path = await run_in_threadpool(storage.upload_file_multipart, file.file, key)
    except Exception as exc:
        video.status = "Failed"
        await db.merge(video)
        await db.commit()
        raise HTTPException(status_code=500, detail=f"upload failed: {exc}")

    # Calculate duration using ffprobe
    duration = None
    if video_path:
        try:
            cmd = [
                "ffprobe",
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1:noprint_wrappers=1",
                video_path,
            ]
            result = await run_in_threadpool(
                subprocess.run, 
                cmd, 
                check=True, 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE,
                text=True
            )
            duration = float(result.stdout.strip())
        except Exception as e:
            # If ffprobe fails, just continue without duration
            print(f"Warning: Could not calculate duration: {e}")

    # Mark as Draft when upload is complete
    video.status = "Draft"
    video.duration = duration
    await db.merge(video)
    await db.commit()
    await db.refresh(video)

    return video


@app.get("/videos")
async def list_videos(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    search: str | None = Query(None),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    List videos with pagination, search, and filtering.
    
    Query Parameters:
    - page: Page number (default: 1)
    - size: Items per page (default: 10, max: 100)
    - search: Search by title (case-insensitive partial match)
    - status: Filter by status (Draft, Uploading, Processing, Ready, Failed)
    
    Returns: {items, total, page, size, pages}
    """
    stmt = select(Video)
    
    # Apply filters
    if search:
        stmt = stmt.where(Video.title.ilike(f"%{search}%"))
    if status:
        stmt = stmt.where(Video.status == status)
    
    # Get total count before pagination
    total_res = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = total_res.scalar_one()
    
    # Calculate total pages
    total_pages = (total + size - 1) // size
    
    # Apply pagination and ordering
    stmt = stmt.order_by(Video.created_at.desc()).offset((page - 1) * size).limit(size)
    res = await db.execute(stmt)
    items = res.scalars().all()
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": total_pages
    }
