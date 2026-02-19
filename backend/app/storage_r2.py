import os
from botocore.client import Config
from fastapi import UploadFile
from typing import Union
from dotenv import load_dotenv
import aioboto3

load_dotenv()

R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY")
R2_SECRET_KEY = os.getenv("R2_SECRET_KEY")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME")
R2_ENDPOINT_URL = os.getenv("R2_ENDPOINT_URL")

if not all([R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET_NAME, R2_ENDPOINT_URL]):
    raise EnvironmentError("R2 environment variables not set!")

# Upload a file to R2
async def upload_file_to_r2(file: Union[UploadFile, "io.BufferedReader"], filename: str) -> str:
    session = aioboto3.Session()
    async with session.client(
        "s3",
        region_name="auto",
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
    ) as s3:
        if hasattr(file, "file"):  # UploadFile object
            file.file.seek(0)
            await s3.upload_fileobj(file.file, R2_BUCKET_NAME, filename)
        else:  # file-like object
            await s3.upload_fileobj(file, R2_BUCKET_NAME, filename)
    return filename  # store only filename, URL will be generated via signed URL

# Generate a signed URL for private R2 bucket
async def get_signed_url(filename: str, expires_in: int = 3600) -> str:
    session = aioboto3.Session()
    async with session.client(
        "s3",
        region_name="auto",
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
    ) as s3:
        url = await s3.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": R2_BUCKET_NAME,
                "Key": filename,
            },
            ExpiresIn=expires_in,
        )
    return url
