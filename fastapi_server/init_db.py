import sqlite3
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init_db():
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL
        )
    """)
    
    # Create default admin if not exists
    cursor.execute("SELECT * FROM users WHERE email = 'admin@example.com'")
    admin = cursor.fetchone()
    if not admin:
        hashed_password = pwd_context.hash("admin123")
        cursor.execute("INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)", 
                       ("admin@example.com", hashed_password, "admin"))
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized with default admin: admin@example.com / admin123")
