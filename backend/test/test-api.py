import pytest
from io import BytesIO


@pytest.mark.asyncio
async def test_full_video_lifecycle(client):
    """
    Full happy-path API test:
    1. Upload video
    2. List videos
    3. Get video by ID
    4. Update video
    """

    # ---------------------------
    # 1️⃣ CREATE VIDEO
    # ---------------------------
    fake_video = BytesIO(b"fake video content")
    fake_video.name = "test.mp4"

    create_res = await client.post(
        "/videos",
        data={
            "title": "My Test Video",
            "description": "API test video"
        },
        files={
            "file": ("test.mp4", fake_video, "video/mp4")
        }
    )

    assert create_res.status_code == 200
    created = create_res.json()

    assert created["id"]
    assert created["title"] == "My Test Video"
    assert created["description"] == "API test video"
    assert created["status"] == "Draft"
    assert created["video_url"].startswith("/videos/")

    video_id = created["id"]

    # ---------------------------
    # 2️⃣ LIST VIDEOS
    # ---------------------------
    list_res = await client.get("/videos")

    assert list_res.status_code == 200
    list_data = list_res.json()

    assert list_data["total"] >= 1
    assert any(v["id"] == video_id for v in list_data["items"])

    # ---------------------------
    # 3️⃣ GET VIDEO BY ID
    # ---------------------------
    get_res = await client.get(f"/videos/{video_id}")

    assert get_res.status_code == 200
    fetched = get_res.json()

    assert fetched["id"] == video_id
    assert fetched["title"] == "My Test Video"
    assert fetched["segments"] == []

    # ---------------------------
    # 4️⃣ UPDATE VIDEO
    # ---------------------------
    update_res = await client.patch(
        f"/videos/{video_id}",
        json={
            "title": "Updated Title",
            "status": "Ready"
        }
    )

    assert update_res.status_code == 200
    updated = update_res.json()

    assert updated["title"] == "Updated Title"
    assert updated["status"] == "Ready"


@pytest.mark.asyncio
async def test_get_video_not_found(client):
    """GET non-existent video should return 404"""

    res = await client.get("/videos/does-not-exist")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_create_video_validation(client):
    """Missing required fields should fail"""

    # Missing file
    res = await client.post(
        "/videos",
        data={"title": "No File"}
    )
    assert res.status_code == 422

    # Missing title
    fake_video = BytesIO(b"123")
    fake_video.name = "test.mp4"

    res = await client.post(
        "/videos",
        files={"file": ("test.mp4", fake_video, "video/mp4")}
    )
    assert res.status_code == 422
