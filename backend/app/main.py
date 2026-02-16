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

from .db import get_db
from .models import Video, VideoSegment
from .schemas import VideoOut, VideoUpdate, SplitRequest, SplitResult
from . import storage

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

app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")


@app.post("/videos", response_model=VideoOut)
async def create_video(
    title: str = Form(...),
    description: str | None = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    filename = f"{uuid4().hex}_{os.path.basename(file.filename)}"
    path = await run_in_threadpool(storage.upload_file_multipart, file.file, filename)

    cmd = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=nokey=1:noprint_wrappers=1",
        path,
    ]

    result = await run_in_threadpool(
        subprocess.run,
        cmd,
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    video = Video(
        id=uuid4().hex,
        file_id=filename,
        title=title,
        description=description,
        video_url=f"/media/{filename}",
        duration=float(result.stdout.strip()),
        status="Draft",
        created_at=datetime.utcnow(),
    )

    db.add(video)
    await db.commit()
    await db.refresh(video)
    return video


@app.get("/videos/{id}", response_model=VideoOut)
async def get_video(id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Video).where(Video.id == id))
    video = res.scalars().first()
    if not video:
        raise HTTPException(status_code=404)
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
    res = await db.execute(select(Video).where(Video.id == id))
    video = res.scalars().first()
    if not video:
        raise HTTPException(status_code=404)

    src_path = MEDIA_DIR / video.file_id
    if not src_path.exists():
        raise HTTPException(status_code=404)

    video.status = "Processing"
    await db.commit()

    segment_urls: List[str] = []
    new_segments: List[VideoSegment] = []

    with tempfile.TemporaryDirectory() as tmpdir:
        for seg in payload.segments:
            out_name = f"{uuid4().hex}.mp4"
            out_tmp = Path(tmpdir) / out_name

            cmd = [
                "ffmpeg",
                "-y",
                "-ss", str(seg.start),
                "-i", str(src_path),
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

            final_path = MEDIA_DIR / out_name
            shutil.copy2(out_tmp, final_path)

            url = f"/media/{out_name}"
            segment_urls.append(url)

            new_segments.append(
                VideoSegment(
                    id=uuid4().hex,
                    video_id=video.id,
                    start=seg.start,
                    end=seg.end,
                    segment_url=url,
                )
            )

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
    path = MEDIA_DIR / filename

    if not path.exists():
        raise HTTPException(status_code=404)

    return FileResponse(
        path=path,
        media_type="video/mp4",
        filename=filename,
    )


@app.get("/videos")
async def list_videos(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    search: str | None = None,
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Video)

    if search:
        stmt = stmt.where(Video.title.ilike(f"%{search}%"))
    if status:
        stmt = stmt.where(Video.status == status)

    total = (
        await db.execute(select(func.count()).select_from(stmt.subquery()))
    ).scalar_one()

    pages = (total + size - 1) // size

    res = await db.execute(
        stmt.order_by(Video.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )

    return {
        "items": res.scalars().all(),
        "total": total,
        "page": page,
        "size": size,
        "pages": pages,
    }
