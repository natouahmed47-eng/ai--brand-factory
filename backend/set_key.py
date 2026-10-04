from pathlib import Path

key = "sk-or-v1-YOUR_KEY_HERE"

content = f"""DATABASE_URL=postgresql+psycopg://abf_user:abf_password@localhost:5433/abf_db
REDIS_URL=redis://localhost:6380/0
JWT_SECRET=abf-super-secret-key-change-in-production-2026
OPENROUTER_API_KEY=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
"""

Path(".env").write_text(content, encoding="utf-8")
print("OK - .env rewritten completely")
