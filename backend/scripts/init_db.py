"""Initialize database and apply migrations."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import create_tables
from app.core.config import settings


async def main():
    """Initialize the database."""
    print(f"Initializing database: {settings.DATABASE_URL}")
    try:
        await create_tables()
        print("✓ Database tables created successfully")
    except Exception as e:
        print(f"✗ Error creating tables: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
