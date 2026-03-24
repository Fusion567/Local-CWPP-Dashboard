"""
database.py — PostgreSQL connection manager using psycopg2.
All other modules import get_db_connection() from here.
"""

import os
import psycopg2
import psycopg2.extras  # for RealDictCursor
from dotenv import load_dotenv

load_dotenv()


def get_db_connection():
    """
    Returns a psycopg2 connection with RealDictCursor as the default cursor.
    This makes rows behave like Python dicts (just like sqlite3.Row did).
    """
    database_url = os.getenv("DATABASE_URL")

    if database_url:
        conn = psycopg2.connect(database_url, cursor_factory=psycopg2.extras.RealDictCursor)
    else:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", 5432)),
            dbname=os.getenv("DB_NAME", "cwpp_db"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", ""),
            cursor_factory=psycopg2.extras.RealDictCursor,
        )

    return conn
