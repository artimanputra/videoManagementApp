from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4
from datetime import datetime
import os

from .db import get_db, init_db
from .models import Video
from .schemas import VideoCreate, VideoOut
from . import storage
from .schemas import VideoUpdate, SplitRequest, SplitResult
from sqlalchemy import select, update, func
import tempfile
import subprocess
from fastapi import Query
from typing import List
from fastapi.responses import JSONResponse
from pathlib import Path

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await init_db()





@app.post("/videos", response_model=VideoOut)
async def create_video(
    title: str = Form(...),
    description: str | None = Form(None),
    duration: float | None = Form(None),
    status: str = Form("Draft"),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Accepts a multipart upload and stores the file to Cloudflare R2 in chunks,
    then stores metadata in the DB.
    """
    # prepare key
    filename = os.path.basename(file.filename)
    key = f"{uuid4().hex}_{filename}"

    # Save file to local videos directory
    try:
        await run_in_threadpool(storage.upload_file_multipart, file.file, key)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"upload failed: {exc}")

    # Local file path as URL
    video_url = f"/videos/{key}"

    # insert into DB
    video = Video(
        title=title,
        description=description,
        video_url=video_url,
        duration=duration,
        status=status,
        created_at=datetime.utcnow(),
    )
    db.add(video)
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
    stmt = select(Video)
    if search:
        stmt = stmt.where(Video.title.ilike(f"%{search}%"))
    if status:
        stmt = stmt.where(Video.status == status)
    total_res = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = total_res.scalar_one()
    stmt = stmt.offset((page - 1) * size).limit(size)
    res = await db.execute(stmt)
    items = res.scalars().all()
    return {"items": items, "total": total, "page": page, "size": size}


@app.get("/videos/{video_id}", response_model=VideoOut)
async def get_video(video_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Video).where(Video.id == video_id))
    video = res.scalars().first()
    if not video:
        raise HTTPException(status_code=404, detail="video not found")
    return video


@app.patch("/videos/{video_id}", response_model=VideoOut)
async def update_video(video_id: int, payload: VideoUpdate, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Video).where(Video.id == video_id))
    video = res.scalars().first()
    if not video:
        raise HTTPException(status_code=404, detail="video not found")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(video, field, value)
    db.add(video)
    await db.commit()
    await db.refresh(video)
    return video


@app.post("/videos/{video_id}/split", response_model=SplitResult)
async def split_video(video_id: int, payload: SplitRequest, db: AsyncSession = Depends(get_db)):
    # Fetch video
    res = await db.execute(select(Video).where(Video.id == video_id))
    video = res.scalars().first()
    if not video:
        raise HTTPException(status_code=404, detail="video not found")

    # mark processing
    video.status = "Processing"
    db.add(video)
    await db.commit()

    # Determine source key from video_url (for local, just strip /videos/ prefix)
    src_key = video.video_url
    if src_key.startswith("/videos/"):
        src_key = src_key[len("/videos/"):]

    segment_urls: List[str] = []

    # Download source file
    with tempfile.TemporaryDirectory() as tmpdir:
        local_src = Path(tmpdir) / "source"
        try:
            storage.download_to_file(src_key, str(local_src))
        except Exception as exc:
            video.status = "Failed"
            db.add(video)
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
                db.add(video)
                await db.commit()
                raise HTTPException(status_code=500, detail=f"ffmpeg failed: {exc}")

            # upload segment
            seg_key = f"{video_id}_segment_{uuid4().hex}_seg{idx}.mp4"
            try:
                await run_in_threadpool(storage.upload_file_multipart, open(out_path, "rb"), seg_key)
            except Exception as exc:
                video.status = "Failed"
                db.add(video)
                await db.commit()
                raise HTTPException(status_code=500, detail=f"upload segment failed: {exc}")

            segment_urls.append(storage.get_public_url(seg_key))

    # mark ready
    video.status = "Ready"
    db.add(video)
    await db.commit()

    return {"segment_urls": segment_urls}