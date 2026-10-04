from pathlib import Path

env_file = Path(".env")@'
content = env_file.read_text(encoding="utf-8")

# اعرض المحتوى الحالي
print("=" * 50)
print("محتوى .env الحالي:")
print("=" * 50)
print(content)
print("=" * 50)
