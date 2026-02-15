"""
Migration script to populate file_id for existing videos.
Extracts file_id from video_url field.
"""

import asyncio
from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError
from app.db import AsyncSessionLocal


async def migrate_file_ids():
    """Populate file_id from video_url for all existing videos."""
    async with AsyncSessionLocal() as session:
        try:
            # First, try to add the file_id column if it doesn't exist
            try:
                await session.execute(text("""
                    ALTER TABLE videos ADD COLUMN file_id VARCHAR UNIQUE;
                """))
                await session.commit()
                print("✓ Added file_id column to videos table")
            except ProgrammingError as e:
                if "already exists" in str(e) or "duplicate" in str(e).lower():
                    print("✓ file_id column already exists")
                    await session.rollback()
                else:
                    raise
            
        except Exception as e:
            print(f"✗ Error adding column: {e}")
            await session.rollback()
    
    # Use a new session for the update
    async with AsyncSessionLocal() as session:
        try:
            # Now populate file_id from video_url using raw SQL
            result = await session.execute(text("""
                UPDATE videos 
                SET file_id = SUBSTRING(video_url FROM 9)
                WHERE file_id IS NULL;
            """))
            await session.commit()
            rows_updated = result.rowcount
            print(f"✓ Updated {rows_updated} videos with file_id")
                
        except Exception as e:
            print(f"✗ Error during migration: {e}")
            await session.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(migrate_file_ids())
