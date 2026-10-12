import os
import re
import uuid
import shutil
import logging
import mimetypes
from typing import Tuple, Optional
from fastapi import UploadFile

from app.config import settings

logger = logging.getLogger("uptrix.s3")

try:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError
except ImportError:
    boto3 = None
    BotoCoreError = Exception
    ClientError = Exception


def is_s3_configured() -> bool:
    """Checks if AWS S3 credentials and bucket name are set."""
    return bool(
        settings.AWS_ACCESS_KEY_ID
        and settings.AWS_SECRET_ACCESS_KEY
        and settings.AWS_S3_BUCKET_NAME
    )


def get_s3_client():
    """Initializes and returns a boto3 S3 client."""
    if not boto3:
        raise RuntimeError("boto3 is not installed. Please run: pip install boto3")
    
    return boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID.strip(),
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY.strip(),
        region_name=(settings.AWS_REGION or "ap-south-1").strip()
    )


def upload_file_to_s3(
    file: UploadFile,
    folder: str = "resume",
    entity_id: Optional[int] = None
) -> Tuple[str, str]:
    """
    Uploads a file to AWS S3 into either the 'image' or 'resume' folder.
    
    Folders:
      - 'image': for candidate photos, avatars, and cover artwork
      - 'resume': for candidate CV and resume documents
    
    Returns:
      (file_url, original_filename)
    """
    # Normalize folder in S3 bucket: 'compliance', 'image', or 'resume'
    if folder in ("compliance", "documents", "legal"):
        target_folder = "compliance"
    elif folder in ("image", "images", "photo", "avatar", "cover"):
        target_folder = "image"
    else:
        target_folder = "resume"

    original_filename = file.filename or "upload"
    # Clean and sanitize filename
    clean_name = re.sub(r'[^a-zA-Z0-9._-]', '_', original_filename)
    short_uid = uuid.uuid4().hex[:8]
    
    if entity_id:
        s3_key = f"{target_folder}/{entity_id}_{short_uid}_{clean_name}"
    else:
        s3_key = f"{target_folder}/{short_uid}_{clean_name}"

    # Guess MIME type
    content_type = file.content_type
    if not content_type or content_type == "application/octet-stream":
        guessed, _ = mimetypes.guess_type(original_filename)
        content_type = guessed or "application/octet-stream"

    # Strict AWS S3 Cloud Upload (No localhost disk storage)
    if not is_s3_configured():
        raise RuntimeError("AWS S3 is not configured. Localhost storage is disabled.")

    try:
        s3 = get_s3_client()
        file.file.seek(0)
        
        s3.upload_fileobj(
            file.file,
            settings.AWS_S3_BUCKET_NAME.strip(),
            s3_key,
            ExtraArgs={
                "ContentType": content_type
            }
        )

        # Build URL
        if settings.AWS_S3_CUSTOM_DOMAIN:
            s3_url = f"https://{settings.AWS_S3_CUSTOM_DOMAIN.strip().rstrip('/')}/{s3_key}"
        else:
            region = (settings.AWS_REGION or "ap-south-1").strip()
            bucket = settings.AWS_S3_BUCKET_NAME.strip()
            s3_url = f"https://{bucket}.s3.{region}.amazonaws.com/{s3_key}"

        logger.info(f"Successfully uploaded to AWS S3: {s3_url}")
        return s3_url, original_filename

    except Exception as err:
        logger.error(f"Failed to upload to AWS S3 (Bucket: {settings.AWS_S3_BUCKET_NAME}): {err}")
        raise RuntimeError(f"AWS S3 Cloud upload failed: {str(err)}")
