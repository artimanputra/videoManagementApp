from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from .db import Base


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    video_url = Column(String, nullable=False)
    duration = Column(Float, nullable=True)
    status = Column(String, nullable=False, default="Draft")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
