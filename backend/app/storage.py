from typing import BinaryIO
import os
from pathlib import Path
import shutil

VIDEOS_DIR = Path(__file__).parent / "videos"
VIDEOS_DIR.mkdir(exist_ok=True)

def upload_file_multipart(fileobj: BinaryIO, key: str, **kwargs) -> str:
    """Save uploaded file to local videos directory."""
    dest_path = VIDEOS_DIR / key
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    with open(dest_path, "wb") as out_file:
        fileobj.seek(0)
        shutil.copyfileobj(fileobj, out_file)
    return str(dest_path)

def download_to_file(key: str, target_path: str, **kwargs) -> str:
    """Copy file from local videos directory to target path."""
    src_path = VIDEOS_DIR / key
    shutil.copyfile(src_path, target_path)
    return target_path

def get_public_url(key: str) -> str:
    """Return the local file path as the public URL (for local use)."""
    return f"/videos/{key}"
