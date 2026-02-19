from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Query
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func
from uuid import uuid4
from datetime import datetime
from pathlib import Path
from typing import List
import tempfile
import subprocess
import os
import shutil

from . import storage_r2  # instead of storage for R2
from .db import get_db
from .deps import get_current_user
from .models import Video, VideoSegment, User
from .schemas import VideoOut, VideoUpdate, SplitRequest, SplitResult
from . import storage
from .auth import router as auth_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MEDIA_DIR = Path(__file__).parent / "videos"
MEDIA_DIR.mkdir(exist_ok=True)


app.include_router(auth_router)


# app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")

@app.post("/videos", response_model=VideoOut)
async def create_video(
    title: str = Form(...),
    description: str | None = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    filename = f"{uuid4().hex}_{os.path.basename(file.filename)}"

    # Upload to R2
    video_url = await storage_r2.upload_file_to_r2(file, filename)

    # Save locally only to get duration
    MEDIA_DIR.mkdir(exist_ok=True)
    temp_path = MEDIA_DIR / filename
    file.file.seek(0)
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    # ffprobe to get duration
    cmd = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=nokey=1:noprint_wrappers=1",
        str(temp_path),
    ]

    result = await run_in_threadpool(
        subprocess.run,
        cmd,
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    temp_path.unlink(missing_ok=True)

    video = Video(
        id=uuid4().hex,
        user_id=user.id,
        file_id=filename,
        title=title,
        description=description,
        video_url=video_url,  # ✅ R2 URL
        duration=float(result.stdout.strip()),
        status="Draft",
        created_at=datetime.utcnow(),
    )

    db.add(video)
    await db.commit()
    await db.refresh(video)
    return video


@app.get("/videos/{id}", response_model=VideoOut)
async def get_video(id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    res = await db.execute(select(Video).where(Video.id == id, Video.user_id == user.id))
    video = res.scalars().first()
    if not video:
        raise HTTPException(status_code=404)

    video.video_url = await storage_r2.get_signed_url(video.file_id)

    for seg in video.segments:
        seg.segment_url = await storage_r2.get_signed_url(seg.segment_url.replace("/media/", ""))

    return video



@app.patch("/videos/{id}", response_model=VideoOut)
async def update_video(id: str, payload: VideoUpdate, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Video).where(Video.id == id))
    video = res.scalars().first()
    if not video:
        raise HTTPException(status_code=404)

    for k, v in payload.dict(exclude_unset=True).items():
        setattr(video, k, v)

    await db.commit()
    await db.refresh(video)
    return video

@app.post("/videos/{id}/split", response_model=SplitResult)
async def split_video(id: str, payload: SplitRequest, db: AsyncSession = Depends(get_db)):
    # Fetch video from DB
    res = await db.execute(select(Video).where(Video.id == id))
    video = res.scalars().first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Mark video as processing
    video.status = "Processing"
    await db.commit()

    segment_urls: List[str] = []
    new_segments: List[VideoSegment] = []

    source_url = await storage_r2.get_signed_url(video.file_id)

    import aiohttp
    import tempfile
    import shutil

    async with aiohttp.ClientSession() as session:
        async with session.get(source_url) as resp:
            if resp.status != 200:
                raise HTTPException(status_code=404, detail="Could not fetch video from R2")
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp_file:
                tmp_path = Path(tmp_file.name)
                tmp_file.write(await resp.content.read())

    with tempfile.TemporaryDirectory() as tmpdir:
        for seg in payload.segments:
            out_name = f"{uuid4().hex}.mp4"
            out_tmp = Path(tmpdir) / out_name

            cmd = [
                "ffmpeg",
                "-y",
                "-ss", str(seg.start),
                "-i", str(tmp_path),
                "-t", str(seg.end - seg.start),
                "-movflags", "faststart",
                str(out_tmp),
            ]

            await run_in_threadpool(
                subprocess.run,
                cmd,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )

            with open(out_tmp, "rb") as segment_file:
                segment_url = await storage_r2.upload_file_to_r2(segment_file, out_name)

            segment_urls.append(segment_url)

            new_segments.append(
                VideoSegment(
                    id=uuid4().hex,
                    video_id=video.id,
                    start=seg.start,
                    end=seg.end,
                    segment_url=segment_url,
                )
            )

    tmp_path.unlink(missing_ok=True)

    for s in new_segments:
        db.add(s)

    video.status = "Ready"
    await db.commit()

    return {"segment_urls": segment_urls}


@app.get("/media/segments/{id}")
async def download_segment(id: str, db: AsyncSession = Depends(get_db)):

    res = await db.execute(select(VideoSegment).where(VideoSegment.id == id))
    segment = res.scalars().first()
    if not segment:
        raise HTTPException(status_code=404)

    filename = segment.segment_url.replace("/media/", "")
    signed_url = await storage_r2.get_signed_url(filename)

    return {"url": signed_url}


@app.get("/videos")
async def list_videos(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    search: str | None = None,
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Video).where(Video.user_id == user.id)
    if search:
        stmt = stmt.where(Video.title.ilike(f"%{search}%"))
    if status:
        stmt = stmt.where(Video.status == status)

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    pages = (total + size - 1) // size

    res = await db.execute(stmt.order_by(Video.created_at.desc()).offset((page - 1) * size).limit(size))
    videos = res.scalars().all()

    # Generate signed URLs
    for video in videos:
        video.video_url = await storage_r2.get_signed_url(video.file_id)
        for seg in video.segments:
            seg.segment_url = await storage_r2.get_signed_url(seg.segment_url.replace("/media/", ""))

    return {
        "items": videos,
        "total": total,
        "page": page,
        "size": size,
        "pages": pages,
    }

@app.delete("/videos/{id}", status_code=204)
async def delete_video(
    id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Get video owned by user
    res = await db.execute(
        select(Video).where(
            Video.id == id,
            Video.user_id == user.id,
        )
    )
    video = res.scalars().first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Delete main video file
    video_path = MEDIA_DIR / video.file_id
    if video_path.exists():
        video_path.unlink()

    # Get and delete segments
    seg_res = await db.execute(
        select(VideoSegment).where(VideoSegment.video_id == video.id)
    )
    segments = seg_res.scalars().all()

    for seg in segments:
        seg_file = MEDIA_DIR / seg.segment_url.replace("/media/", "")
        if seg_file.exists():
            seg_file.unlink()
        await db.delete(seg)

    # Delete video record
    await db.delete(video)
    await db.commit()

    return
