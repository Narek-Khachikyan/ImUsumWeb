
import logging
import os
import sys
from pathlib import Path

# Resolve paths relative to this script so behavior is consistent
# regardless of where the command is invoked.
BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))
os.chdir(BACKEND_DIR)

from app.database import engine
from app.models.base import Base
# Import all models to ensure they are registered in Base.metadata
from app.models import *

# For alembic stamping
from alembic.config import Config
from alembic import command

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def reset_database():
    logger.info("Starting database reset...")
    
    try:
        # Drop all tables
        logger.info("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        logger.info("All tables dropped.")
        
        # Create all tables
        logger.info("Creating all tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("All tables created.")
        
        # Stamp alembic if alembic.ini exists
        alembic_ini = BACKEND_DIR / "alembic.ini"
        if alembic_ini.exists():
            logger.info("Stamping alembic head...")
            alembic_cfg = Config(str(alembic_ini))
            command.stamp(alembic_cfg, "head")
            logger.info("Alembic stamped to head.")
            
        logger.info("Database reset successfully completed.")
        
    except Exception as e:
        logger.error(f"An error occurred during database reset: {e}")
        sys.exit(1)

if __name__ == "__main__":
    reset_database()
