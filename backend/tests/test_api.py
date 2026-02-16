import pytest
from unittest.mock import patch
from subprocess import CompletedProcess
from uuid import uuid4
from app.schemas import SplitRequest, SplitResult


@pytest.mark.asyncio
async def test_create_video_success(client):
    # Already exists, can be reused
    with patch("subprocess.run") as mock_run:
        mock_run.return_value = CompletedProcess(
            args=["ffprobe"],
            returncode=0,
            stdout="12.34\n",
            stderr="",
        )

        response = await client.post(
            "/videos",
            data={"title": "Test Video", "description": "Test description"},
            files={"file": ("test.mp4", b"fake video content", "video/mp4")},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Video"
    assert data["duration"] == 12.34
    assert data["status"] == "Draft"


@pytest.mark.asyncio
async def test_get_video_not_found(client):
    response = await client.get(f"/videos/{uuid4().hex}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_video(client):
    # Create a video first
    with patch("subprocess.run") as mock_run:
        mock_run.return_value = CompletedProcess(
            args=["ffprobe"],
            returncode=0,
            stdout="15.0\n",
            stderr="",
        )
        res = await client.post(
            "/videos",
            data={"title": "Old Title"},
            files={"file": ("test.mp4", b"fake content", "video/mp4")},
        )
    video_id = res.json()["id"]

    # Update the title and description
    payload = {"title": "New Title", "description": "Updated desc"}
    response = await client.patch(f"/videos/{video_id}", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "New Title"
    assert data["description"] == "Updated desc"


@pytest.mark.asyncio
async def test_list_videos(client):
    # Create two videos
    with patch("subprocess.run") as mock_run:
        mock_run.return_value = CompletedProcess(args=["ffprobe"], returncode=0, stdout="10\n", stderr="")
        for i in range(2):
            await client.post(
                "/videos",
                data={"title": f"Video {i}"},
                files={"file": ("test.mp4", b"content", "video/mp4")},
            )

    response = await client.get("/videos?page=1&size=10")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) >= 2
    assert data["total"] >= 2


@pytest.mark.asyncio
async def test_split_video(client):
    # 1️⃣ Mock ffprobe to return a fixed duration
    with patch("subprocess.run") as mock_run_ffprobe:
        mock_run_ffprobe.return_value = CompletedProcess(
            args=["ffprobe"], returncode=0, stdout="20\n", stderr=""
        )

        # Create a video first
        res = await client.post(
            "/videos",
            data={"title": "Splittable Video"},
            files={"file": ("test.mp4", b"content", "video/mp4")},
        )

    video_id = res.json()["id"]

    # 2️⃣ Mock ffmpeg for splitting
    def fake_ffmpeg(*args, **kwargs):
        # Last arg is the output path for ffmpeg
        out_path = Path(args[0][-1])
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_bytes(b"fake video content")  # create a fake file
        return CompletedProcess(args=args[0], returncode=0)

    with patch("subprocess.run", side_effect=fake_ffmpeg):
        payload = {
            "segments": [
                {"start": 0, "end": 5},
                {"start": 5, "end": 10},
            ]
        }
        response = await client.post(f"/videos/{video_id}/split", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert "segment_urls" in data
    assert len(data["segment_urls"]) == 2

@pytest.mark.asyncio
async def test_download_segment_not_found(client):
    response = await client.get(f"/media/segments/{uuid4().hex}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_split_video(client, mock_subprocess):
    # Now you can just call /split without extra patches
    res = await client.post(
        "/videos",
        data={"title": "Splittable Video"},
        files={"file": ("test.mp4", b"content", "video/mp4")},
    )
    video_id = res.json()["id"]

    payload = {"segments": [{"start": 0, "end": 5}, {"start": 5, "end": 10}]}
    response = await client.post(f"/videos/{video_id}/split", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["segment_urls"]) == 2
