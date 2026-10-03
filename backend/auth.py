import os
import hashlib
import secrets
from datetime import datetime, timedelta
import jwt
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET", "change-me-in-production")
print(f"[AUTH] SECRET_KEY loaded: {SECRET_KEY[:20]}...")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours


def hash_password(password: str) -> str:
    """تشفير كلمة المرور باستخدام PBKDF2"""
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000,
    )
    return f"{salt}${pwd_hash.hex()}"


def verify_password(password: str, stored: str) -> bool:
    """التحقق من كلمة المرور"""
    try:
        salt, pwd_hash = stored.split("$")
        new_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            100_000,
        )
        return new_hash.hex() == pwd_hash
    except Exception:
        return False


def create_access_token(user_id: str) -> str:
    """إنشاء JWT token"""
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """فك تشفير JWT token"""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError as e:
        print(f"[AUTH] JWT decode error: {e}")
        return None