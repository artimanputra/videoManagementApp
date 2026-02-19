import os
import asyncio
import boto3
from botocore.client import Config
from pathlib import Path
from typing import Union
from dotenv import load_dotenv

load_dotenv()

R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY")
R2_SECRET_KEY = os.getenv("R2_SECRET_KEY")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME")
R2_ENDPOINT_URL = os.getenv("R2_ENDPOINT_URL")

if not all([R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET_NAME, R2_ENDPOINT_URL]):
    raise EnvironmentError("R2 environment variables not set!")


def _make_client():
    return boto3.client(
        "s3",
        region_name="auto",
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        config=Config(signature_version="s3v4"),
    )


async def upload_file_to_r2(content: bytes, filename: str) -> str:
    """Upload raw bytes to R2 (for small files / upload from memory)."""
    def _upload():
        client = _make_client()
        client.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=filename,
            Body=content,
        )

    await asyncio.get_event_loop().run_in_executor(None, _upload)
    return filename


async def upload_file_path_to_r2(file_path: Path, filename: str) -> str:
    """Stream upload from a file path — memory efficient for large files."""
    def _upload():
        client = _make_client()
        with open(file_path, "rb") as f:
            client.upload_fileobj(f, R2_BUCKET_NAME, filename)

    await asyncio.get_event_loop().run_in_executor(None, _upload)
    return filename


async def get_signed_url(filename: str, expires_in: int = 3600) -> str:
    def _sign():
        client = _make_client()
        return client.generate_presigned_url(
            "get_object",
            Params={"Bucket": R2_BUCKET_NAME, "Key": filename},
            ExpiresIn=expires_in,
        )

    return await asyncio.get_event_loop().run_in_executor(None, _sign)