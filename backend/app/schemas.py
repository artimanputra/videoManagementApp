from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
PYDANTIC_V2 = hasattr(BaseModel, "model_config")


class SegmentOut(BaseModel):
    id: str
    start: float
    end: float
    segment_url: str
    created_at: datetime

    if PYDANTIC_V2:
        model_config = ConfigDict(from_attributes=True)
    else:
        class Config:
            orm_mode = True


class VideoCreate(BaseModel):
    title: str
    description: Optional[str] = None
    duration: Optional[float] = None
    status: Optional[str] = "Draft"


class VideoOut(BaseModel):
    id: str
    title: str
    description: Optional[str]
    video_url: str
    duration: Optional[float]
    status: str
    created_at: datetime
    segments: List[SegmentOut] = []

    if PYDANTIC_V2:
        model_config = ConfigDict(from_attributes=True)
    else:
        class Config:
            orm_mode = True


class VideoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class Segment(BaseModel):
    start: float
    end: float


class SplitRequest(BaseModel):
    segments: list[Segment]


class SplitResult(BaseModel):
    segment_urls: list[str]
