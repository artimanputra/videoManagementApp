from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# pydantic v2 renamed `orm_mode` -> `from_attributes`. Detect and be compatible
PYDANTIC_V2 = hasattr(BaseModel, "model_config")


class VideoCreate(BaseModel):
    title: str
    description: Optional[str] = None
    duration: Optional[float] = None
    status: Optional[str] = "Draft"


class VideoOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    video_url: str
    duration: Optional[float]
    status: str
    created_at: datetime

    if PYDANTIC_V2:
        model_config = {"from_attributes": True}
    else:
        class Config:
            orm_mode = True


class VideoUpdate(BaseModel):
    title: Optional[str]
    description: Optional[str]
    status: Optional[str]


class Segment(BaseModel):
    start: float
    end: float


class SplitRequest(BaseModel):
    segments: list[Segment]


class SplitResult(BaseModel):
    segment_urls: list[str]
