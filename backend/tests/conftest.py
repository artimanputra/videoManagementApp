# tests/conftest.py
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool
from httpx import AsyncClient

from unittest.mock import patch
from subprocess import CompletedProcess
from pathlib import Path
import pytest

from app.db import Base, get_db
from app.main import app

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

AsyncTestingSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


@pytest.fixture(scope="function")
async def db_session():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncTestingSessionLocal() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()


@pytest.fixture
def mock_subprocess():
    """Patch subprocess.run for ffprobe and ffmpeg globally in tests."""
    with patch("subprocess.run") as mock_run:
        def side_effect(cmd, *args, **kwargs):
            if "ffprobe" in cmd[0]:
                return CompletedProcess(args=cmd, returncode=0, stdout="20\n")
            elif "ffmpeg" in cmd[0]:
                out_path = Path(cmd[-1])
                out_path.parent.mkdir(parents=True, exist_ok=True)
                out_path.write_bytes(b"fake video content")
                return CompletedProcess(args=cmd, returncode=0)
            return CompletedProcess(args=cmd, returncode=0)

        mock_run.side_effect = side_effect
        yield mock_run