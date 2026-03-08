import sqlite3
import logging
import os

logger = logging.getLogger(__name__)

def run_migrations():
    """
    Manually check and add new columns to the User table if they don't exist.
    Also creates the Certificate table if missing.
    This is a lightweight migration strategy for SQLite.
    """
    # Use same path as database.py so migrations always target the correct file
    db_path = os.getenv("DATABASE_PATH", "database.db")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get existing columns for user table
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

        # Create certificate table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS certificate (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES user(id),
                course_name TEXT NOT NULL,
                mentor_name TEXT DEFAULT '',
                mentor_id INTEGER REFERENCES user(id),
                completion_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                certificate_url TEXT,
                session_id INTEGER REFERENCES session(id)
            )
        """)
                    
        conn.commit()
        conn.close()
        logger.info("Database migrations check complete.")
        
    except Exception as e:
        logger.error(f"Migration error: {e}")
