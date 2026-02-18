import uuid
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: uuid.uuid4().hex)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    videos = relationship(
        "Video",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class Video(Base):
    __tablename__ = "videos"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)  # 🔐 OWNER
    file_id = Column(String, nullable=True, unique=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    video_url = Column(String, nullable=False)
    duration = Column(Float, nullable=True)
    status = Column(String, nullable=False, default="Draft")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="videos")

    segments = relationship(
        "VideoSegment",
        back_populates="video",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class VideoSegment(Base):
    __tablename__ = "video_segments"

    id = Column(String, primary_key=True, index=True)
    video_id = Column(String, ForeignKey("videos.id"), nullable=False)
    start = Column(Float, nullable=False)
    end = Column(Float, nullable=False)
    segment_url = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    video = relationship("Video", back_populates="segments")
