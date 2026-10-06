from auth import hash_password
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))

new_password = "test12345"
new_hash = hash_password(new_password)

with engine.connect() as conn:
    conn.execute(
        text("UPDATE users SET password_hash = :h WHERE email = :e"),
        {"h": new_hash, "e": "abdelmoumeneahmed15@gmail.com"}
    )
    conn.commit()

print("OK - Password reset to: test12345")
