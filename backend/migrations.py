import sqlite3
import logging

logger = logging.getLogger(__name__)

def run_migrations():
    """
    Manually check and add new columns to the User table if they don't exist.
    This is a lightweight migration strategy for SQLite.
    """
    db_path = "database.db"
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get existing columns
        cursor.execute("PRAGMA table_info(user)")
        columns = [info[1] for info in cursor.fetchall()]
        
        new_columns = {
            "profile_photo_url": "TEXT",
            "bio": "TEXT",
            "github_url": "TEXT",
            "linkedin_url": "TEXT",
            "education": "TEXT",
            "verification_scores": "TEXT"
        }
        
        for col_name, col_type in new_columns.items():
            if col_name not in columns:
                logger.info(f"Migrating DB: Adding column '{col_name}' to 'user' table...")
                try:
                    cursor.execute(f"ALTER TABLE user ADD COLUMN {col_name} {col_type}")
                except Exception as e:
                    logger.error(f"Failed to add column {col_name}: {e}")
                    
        conn.commit()
        conn.close()
        logger.info("Database migrations check complete.")
        
    except Exception as e:
        logger.error(f"Migration error: {e}")
