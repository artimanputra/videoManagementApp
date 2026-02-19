import boto3
import os
import asyncio
from pathlib import Path
from botocore.config import Config

R2_ACCOUNT_ID = os.environ["R2_ACCOUNT_ID"]
R2_ACCESS_KEY_ID = os.environ["R2_ACCESS_KEY_ID"]
R2_SECRET_ACCESS_KEY = os.environ["R2_SECRET_ACCESS_KEY"]
R2_BUCKET_NAME = os.environ["R2_BUCKET_NAME"]
R2_PUBLIC_URL = os.environ.get("R2_PUBLIC_URL", "")  # optional public domain

R2_ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"


def _get_client():
    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
    )


async def upload_file_to_r2(file, filename: str) -> str:
    """Upload a file-like object or UploadFile to R2. Returns the R2 object key (filename)."""
    # Read content — works for both UploadFile and regular file objects
    if hasattr(file, "read"):
        content = file.read()
        if asyncio.iscoroutine(content):
            content = await content
    else:
        content = file

    def _upload():
        client = _get_client()
        client.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=filename,
            Body=content,
        )

    await asyncio.get_event_loop().run_in_executor(None, _upload)

    # Return just the filename/key — generate signed URLs separately when needed
    return filename


async def get_signed_url(filename: str, expires_in: int = 3600) -> str:
    """Generate a presigned URL for downloading a file from R2."""
    def _sign():
        client = _get_client()
        return client.generate_presigned_url(
            "get_object",
            Params={"Bucket": R2_BUCKET_NAME, "Key": filename},
            ExpiresIn=expires_in,
        )

    return await asyncio.get_event_loop().run_in_executor(None, _sign)