import pytest
from io import BytesIO
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import Video, VideoSegment
from app.schemas import VideoCreate, VideoOut


class TestVideoEndpoints:
    """Test suite for video management endpoints."""
    
    @pytest.mark.asyncio
    async def test_create_video_success(self, client, sample_video_file):
        """Test successful video creation."""
        with open(sample_video_file, "rb") as f:
            response = await client.post(
                "/videos",
                data={"title": "Test Video", "description": "Test Description"},
                files={"file": ("test.mp4", f, "video/mp4")}
            )
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test Video"
        assert data["description"] == "Test Description"
        assert data["status"] == "Draft"
        assert "video_url" in data
        assert data["id"] is not None
    
    
    @pytest.mark.asyncio
    async def test_create_video_minimal(self, client, sample_video_file):
        """Test video creation with minimal fields."""
        with open(sample_video_file, "rb") as f:
            response = await client.post(
                "/videos",
                data={"title": "Minimal Video"},
                files={"file": ("test.mp4", f, "video/mp4")}
            )
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Minimal Video"
        assert data["description"] is None
        assert data["status"] == "Draft"
    
    
    @pytest.mark.asyncio
    async def test_create_video_missing_title(self, client, sample_video_file):
        """Test video creation fails without title."""
        with open(sample_video_file, "rb") as f:
            response = await client.post(
                "/videos",
                data={},
                files={"file": ("test.mp4", f, "video/mp4")}
            )
        
        assert response.status_code == 422  # Unprocessable Entity
    
    
    @pytest.mark.asyncio
    async def test_create_video_missing_file(self, client):
        """Test video creation fails without file."""
        response = await client.post(
            "/videos",
            data={"title": "No File Video"}
        )
        
        assert response.status_code == 422
    
    
    @pytest.mark.asyncio
    async def test_list_videos_empty(self, client):
        """Test listing videos when none exist."""
        response = await client.get("/videos")
        
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0
        assert data["page"] == 1
        assert data["size"] == 10
        assert data["pages"] == 0
    
    
    @pytest.mark.asyncio
    async def test_list_videos_pagination(self, client, db_session):
        """Test video listing with pagination."""
        # Create 15 videos
        for i in range(15):
            video = Video(
                title=f"Video {i}",
                description=f"Description {i}",
                video_url=f"/videos/video_{i}.mp4",
                status="Draft",
                duration=60.0
            )
            db_session.add(video)
        await db_session.commit()
        
        # Test first page
        response = await client.get("/videos?page=1&size=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 10
        assert data["total"] == 15
        assert data["pages"] == 2
        assert data["page"] == 1
        
        # Test second page
        response = await client.get("/videos?page=2&size=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 5
        assert data["page"] == 2
    
    
    @pytest.mark.asyncio
    async def test_list_videos_with_search(self, client, db_session):
        """Test video listing with search filter."""
        videos = [
            Video(title="Python Tutorial", video_url="/videos/1.mp4", status="Draft"),
            Video(title="JavaScript Guide", video_url="/videos/2.mp4", status="Draft"),
            Video(title="Python Advanced", video_url="/videos/3.mp4", status="Draft"),
        ]
        for v in videos:
            db_session.add(v)
        await db_session.commit()
        
        # Search for Python videos
        response = await client.get("/videos?search=Python")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert all("Python" in item["title"] for item in data["items"])
    
    
    @pytest.mark.asyncio
    async def test_list_videos_with_status_filter(self, client, db_session):
        """Test video listing with status filter."""
        videos = [
            Video(title="Draft Video", video_url="/videos/1.mp4", status="Draft"),
            Video(title="Ready Video", video_url="/videos/2.mp4", status="Ready"),
            Video(title="Another Draft", video_url="/videos/3.mp4", status="Draft"),
        ]
        for v in videos:
            db_session.add(v)
        await db_session.commit()
        
        # Filter by Draft status
        response = await client.get("/videos?status=Draft")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert all(item["status"] == "Draft" for item in data["items"])
        
        # Filter by Ready status
        response = await client.get("/videos?status=Ready")
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["status"] == "Ready"
    
    
    @pytest.mark.asyncio
    async def test_list_videos_pagination_invalid_page(self, client):
        """Test pagination with invalid page number."""
        response = await client.get("/videos?page=0")
        assert response.status_code == 422
        
        response = await client.get("/videos?page=-1")
        assert response.status_code == 422
    
    
    @pytest.mark.asyncio
    async def test_get_video_success(self, client, db_session):
        """Test fetching a single video."""
        video = Video(
            title="Test Video",
            description="Test Description",
            video_url="/videos/test.mp4",
            status="Draft",
            duration=120.0
        )
        db_session.add(video)
        await db_session.commit()
        await db_session.refresh(video)
        
        response = await client.get(f"/videos/{video.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == video.id
        assert data["title"] == "Test Video"
        assert data["duration"] == 120.0
    
    
    @pytest.mark.asyncio
    async def test_get_video_with_segments(self, client, db_session):
        """Test fetching video with its segments."""
        video = Video(
            title="Video with Segments",
            video_url="/videos/test.mp4",
            status="Ready",
            duration=300.0
        )
        db_session.add(video)
        await db_session.flush()
        
        # Add segments
        segments = [
            VideoSegment(video_id=video.id, start=0, end=60, segment_url="/videos/seg1.mp4"),
            VideoSegment(video_id=video.id, start=60, end=120, segment_url="/videos/seg2.mp4"),
        ]
        for seg in segments:
            db_session.add(seg)
        await db_session.commit()
        
        response = await client.get(f"/videos/{video.id}")
        assert response.status_code == 200
        data = response.json()
        assert len(data["segments"]) == 2
        assert data["segments"][0]["start"] == 0
        assert data["segments"][0]["end"] == 60
    
    
    @pytest.mark.asyncio
    async def test_get_video_not_found(self, client):
        """Test fetching non-existent video."""
        response = await client.get("/videos/999")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    
    @pytest.mark.asyncio
    async def test_update_video_title(self, client, db_session):
        """Test updating video title."""
        video = Video(
            title="Original Title",
            video_url="/videos/test.mp4",
            status="Draft"
        )
        db_session.add(video)
        await db_session.commit()
        await db_session.refresh(video)
        
        response = await client.patch(
            f"/videos/{video.id}",
            json={"title": "Updated Title"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
    
    
    @pytest.mark.asyncio
    async def test_update_video_description(self, client, db_session):
        """Test updating video description."""
        video = Video(
            title="Test Video",
            video_url="/videos/test.mp4",
            status="Draft"
        )
        db_session.add(video)
        await db_session.commit()
        await db_session.refresh(video)
        
        response = await client.patch(
            f"/videos/{video.id}",
            json={"description": "New description"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["description"] == "New description"
    
    
    @pytest.mark.asyncio
    async def test_update_video_status(self, client, db_session):
        """Test updating video status."""
        video = Video(
            title="Test Video",
            video_url="/videos/test.mp4",
            status="Draft"
        )
        db_session.add(video)
        await db_session.commit()
        await db_session.refresh(video)
        
        response = await client.patch(
            f"/videos/{video.id}",
            json={"status": "Ready"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "Ready"
    
    
    @pytest.mark.asyncio
    async def test_update_video_multiple_fields(self, client, db_session):
        """Test updating multiple video fields at once."""
        video = Video(
            title="Original",
            description="Original Description",
            video_url="/videos/test.mp4",
            status="Draft"
        )
        db_session.add(video)
        await db_session.commit()
        await db_session.refresh(video)
        
        response = await client.patch(
            f"/videos/{video.id}",
            json={
                "title": "Updated",
                "description": "Updated Description",
                "status": "Processing"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated"
        assert data["description"] == "Updated Description"
        assert data["status"] == "Processing"
    
    
    @pytest.mark.asyncio
    async def test_update_video_not_found(self, client):
        """Test updating non-existent video."""
        response = await client.patch(
            "/videos/999",
            json={"title": "Updated"}
        )
        assert response.status_code == 404
    
    
    @pytest.mark.asyncio
    async def test_update_video_no_changes(self, client, db_session):
        """Test update with no actual changes."""
        video = Video(
            title="Test Video",
            video_url="/videos/test.mp4",
            status="Draft"
        )
        db_session.add(video)
        await db_session.commit()
        await db_session.refresh(video)
        
        response = await client.patch(
            f"/videos/{video.id}",
            json={}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test Video"
    
    
    @pytest.mark.asyncio
    async def test_split_video_validation(self, client, db_session):
        """Test split endpoint with invalid segment data."""
        video = Video(
            title="Test Video",
            video_url="/videos/test.mp4",
            status="Draft",
            duration=120.0
        )
        db_session.add(video)
        await db_session.commit()
        await db_session.refresh(video)
        
        # Invalid: missing segments
        response = await client.post(
            f"/videos/{video.id}/split",
            json={}
        )
        assert response.status_code == 422
    
    
    @pytest.mark.asyncio
    async def test_split_video_not_found(self, client):
        """Test split on non-existent video."""
        response = await client.post(
            "/videos/999/split",
            json={"segments": [{"start": 0, "end": 10}]}
        )
        assert response.status_code == 404


class TestVideoModels:
    """Test database models and relationships."""
    
    @pytest.mark.asyncio
    async def test_video_creation(self, db_session):
        """Test creating a video in database."""
        video = Video(
            title="Test Video",
            description="Test Description",
            video_url="/videos/test.mp4",
            status="Draft",
            duration=120.0
        )
        db_session.add(video)
        await db_session.commit()
        
        # Verify it was saved
        result = await db_session.execute(
            select(Video).where(Video.id == video.id)
        )
        saved_video = result.scalars().first()
        assert saved_video is not None
        assert saved_video.title == "Test Video"
    
    
    @pytest.mark.asyncio
    async def test_video_segment_relationship(self, db_session):
        """Test video to segments relationship."""
        video = Video(
            title="Test Video",
            video_url="/videos/test.mp4",
            status="Draft"
        )
        db_session.add(video)
        await db_session.flush()
        
        segments = [
            VideoSegment(video_id=video.id, start=0, end=60, segment_url="/seg1.mp4"),
            VideoSegment(video_id=video.id, start=60, end=120, segment_url="/seg2.mp4"),
        ]
        for seg in segments:
            db_session.add(seg)
        await db_session.commit()
        await db_session.refresh(video)
        
        assert len(video.segments) == 2
        assert video.segments[0].start == 0
        assert video.segments[1].end == 120
    
    
    @pytest.mark.asyncio
    async def test_video_cascade_delete(self, db_session):
        """Test cascade delete of segments when video is deleted."""
        video = Video(
            title="Test Video",
            video_url="/videos/test.mp4",
            status="Draft"
        )
        db_session.add(video)
        await db_session.flush()
        
        segment = VideoSegment(
            video_id=video.id,
            start=0,
            end=60,
            segment_url="/seg1.mp4"
        )
        db_session.add(segment)
        await db_session.commit()
        
        # Delete the video
        await db_session.delete(video)
        await db_session.commit()
        
        # Verify segment is also deleted
        result = await db_session.execute(
            select(VideoSegment).where(VideoSegment.video_id == video.id)
        )
        segments = result.scalars().all()
        assert len(segments) == 0
    
    
    @pytest.mark.asyncio
    async def test_video_default_status(self, db_session):
        """Test video default status is 'Draft'."""
        video = Video(
            title="Test Video",
            video_url="/videos/test.mp4"
        )
        db_session.add(video)
        await db_session.commit()
        
        assert video.status == "Draft"


class TestVideoSchemas:
    """Test Pydantic schemas for validation."""
    
    def test_video_create_schema(self):
        """Test VideoCreate schema validation."""
        data = {
            "title": "Test Video",
            "description": "Test Description"
        }
        schema = VideoCreate(**data)
        assert schema.title == "Test Video"
        assert schema.description == "Test Description"
    
    
    def test_video_create_schema_minimal(self):
        """Test VideoCreate with minimal fields."""
        data = {"title": "Test Video"}
        schema = VideoCreate(**data)
        assert schema.title == "Test Video"
        assert schema.description is None
    
    
    def test_video_create_schema_invalid(self):
        """Test VideoCreate with missing required fields."""
        with pytest.raises(ValueError):
            VideoCreate(description="No title")
    
    
    def test_video_out_schema(self):
        """Test VideoOut schema."""
        data = {
            "id": 1,
            "title": "Test Video",
            "description": "Test Description",
            "video_url": "/videos/test.mp4",
            "duration": 120.0,
            "status": "Draft",
            "created_at": "2024-01-01T00:00:00Z",
            "segments": []
        }
        schema = VideoOut(**data)
        assert schema.id == 1
        assert schema.title == "Test Video"
        assert len(schema.segments) == 0
