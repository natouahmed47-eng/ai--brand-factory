import os
import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.staticfiles import StaticFiles
import shutil
from pathlib import Path
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker, Session
from redis import Redis
from dotenv import load_dotenv
from pydantic import BaseModel, EmailStr

from auth import hash_password, verify_password, create_access_token, decode_access_token
from brand_brain import extract_colors
from ai_service import generate_creative_ideas, generate_script, generate_scene_music

load_dotenv()

app = FastAPI(title="AI Brand Factory API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL")
REDIS_URL = os.getenv("REDIS_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
redis_client = Redis.from_url(REDIS_URL)


# ============ Models ============
class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String, ForeignKey("workspaces.id"), nullable=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String)
    plan: Mapped[str] = mapped_column(String, default="starter")
    credits: Mapped[int] = mapped_column(default=100)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Brand(Base):
    __tablename__ = "brands"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String, ForeignKey("workspaces.id"))
    name: Mapped[str] = mapped_column(String)
    logo_url: Mapped[str] = mapped_column(String, nullable=True)
    colors: Mapped[dict] = mapped_column(JSON, nullable=True)
    personality: Mapped[dict] = mapped_column(JSON, nullable=True)
    audience: Mapped[dict] = mapped_column(JSON, nullable=True)
    rules: Mapped[dict] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)

# Migration: إضافة عمود colors إذا لم يكن موجودًا
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE brands ADD COLUMN IF NOT EXISTS colors JSON"))
        conn.execute(text("ALTER TABLE brands ADD COLUMN IF NOT EXISTS personality JSON"))
        conn.execute(text("ALTER TABLE brands ADD COLUMN IF NOT EXISTS audience JSON"))
        conn.execute(text("ALTER TABLE brands ADD COLUMN IF NOT EXISTS rules JSON"))
        conn.commit()
except Exception as e:
    print(f"[MIGRATION] {e}")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# ============ Schemas ============
class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    workspace_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ============ Helpers ============
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ============ Routes ============
@app.get("/")
def root():
    return {"message": "AI Brand Factory API"}


@app.get("/health")
def health():
    return {"status": "ok", "service": "backend"}


@app.get("/health/db")
def health_db():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}


@app.get("/health/redis")
def health_redis():
    try:
        redis_client.ping()
        return {"status": "ok", "redis": "connected"}
    except Exception as e:
        return {"status": "error", "redis": str(e)}


@app.post("/auth/signup")
def signup(data: SignUpRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    workspace = Workspace(name=data.workspace_name)
    db.add(workspace)
    db.flush()

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        workspace_id=workspace.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return {
        "token": token,
        "user": {"id": user.id, "email": user.email},
        "workspace": {"id": workspace.id, "name": workspace.name, "plan": workspace.plan},
    }


@app.post("/auth/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.id)
    workspace = db.query(Workspace).filter(Workspace.id == user.workspace_id).first()
    return {
        "token": token,
        "user": {"id": user.id, "email": user.email},
        "workspace": {"id": workspace.id, "name": workspace.name, "plan": workspace.plan} if workspace else None,
    }


@app.get("/auth/me")
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    workspace = db.query(Workspace).filter(Workspace.id == user.workspace_id).first()
    return {
        "user": {"id": user.id, "email": user.email},
        "workspace": {"id": workspace.id, "name": workspace.name, "plan": workspace.plan, "credits": workspace.credits} if workspace else None,
    }



# ============ Brain Helpers ============
def compute_brain_score(brand: Brand) -> int:
    total = 12
    filled = 0
    if brand.logo_url:
        filled += 1
    if brand.colors and brand.colors.get("palette"):
        filled += 1

    p = brand.personality or {}
    if p.get("tone") and len(p.get("tone", [])) >= 2:
        filled += 1
    if p.get("communication_style"):
        filled += 1
    if p.get("emotional_territory"):
        filled += 1

    a = brand.audience or {}
    for key in ["age_range", "gender", "market", "language", "dialect"]:
        if a.get(key):
            filled += 1

    r = brand.rules or {}
    if r.get("visual_defaults"):
        filled += 1
    if r.get("content_defaults"):
        filled += 1

    return round((filled / total) * 100)


def serialize_brand(brand: Brand) -> dict:
    return {
        "id": brand.id,
        "name": brand.name,
        "logo_url": brand.logo_url,
        "colors": brand.colors,
        "personality": brand.personality,
        "audience": brand.audience,
        "rules": brand.rules,
        "brain_score": compute_brain_score(brand),
        "created_at": brand.created_at.isoformat(),
    }

# ============ Brands ============
class CreateBrandRequest(BaseModel):
    name: str
    description: str | None = None


@app.post("/brands")
def create_brand(
    data: CreateBrandRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    brand = Brand(
        workspace_id=user.workspace_id,
        name=data.name,
        logo_url=None,
    )
    db.add(brand)
    db.commit()
    db.refresh(brand)

    return serialize_brand(brand)


@app.get("/brands")
def list_brands(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    brands = db.query(Brand).filter(Brand.workspace_id == user.workspace_id).all()
    return [serialize_brand(b) for b in brands]


@app.get("/brands/{brand_id}")
def get_brand(
    brand_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    brand = db.query(Brand).filter(
        Brand.id == brand_id,
        Brand.workspace_id == user.workspace_id,
    ).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return serialize_brand(brand)

# ============ Uploads ============
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@app.post("/brands/{brand_id}/logo")
def upload_brand_logo(
    brand_id: str,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    brand = db.query(Brand).filter(
        Brand.id == brand_id,
        Brand.workspace_id == user.workspace_id,
    ).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    # امتداد الملف
    ext = Path(file.filename).suffix.lower()
    if ext not in [".png", ".jpg", ".jpeg", ".svg", ".webp"]:
        raise HTTPException(status_code=400, detail="Only image files allowed")

    # حفظ الملف
    filename = f"{brand_id}{ext}"
    filepath = UPLOAD_DIR / filename
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # استخراج الألوان من الشعار
    extracted = extract_colors(str(filepath), num_colors=5)

    # تحديث قاعدة البيانات
    brand.logo_url = f"/uploads/{filename}"
    brand.colors = {"palette": extracted}
    db.commit()
    db.refresh(brand)

    return serialize_brand(brand)



# ============ Brand Brain ============
class UpdateBrainRequest(BaseModel):
    personality: dict | None = None
    audience: dict | None = None
    rules: dict | None = None


@app.patch("/brands/{brand_id}/brain")
def update_brain(
    brand_id: str,
    data: UpdateBrainRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    brand = db.query(Brand).filter(
        Brand.id == brand_id,
        Brand.workspace_id == user.workspace_id,
    ).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    if data.personality is not None:
        brand.personality = data.personality
    if data.audience is not None:
        brand.audience = data.audience
    if data.rules is not None:
        brand.rules = data.rules

    db.commit()
    db.refresh(brand)
    return serialize_brand(brand)



class IdeasRequest(BaseModel):
    brand_id: str


@app.post("/campaigns/ideas")
def campaign_ideas(
    data: IdeasRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    brand = db.query(Brand).filter(
        Brand.id == data.brand_id,
        Brand.workspace_id == user.workspace_id,
    ).first()

    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    brand_data = {
        "name": brand.name,
        "personality": brand.personality or {},
        "audience": brand.audience or {},
        "colors": brand.colors or {},
    }

    ideas = generate_creative_ideas(brand_data)

    if not ideas:
        raise HTTPException(status_code=500, detail="Failed to generate ideas")

    return {"ideas": ideas}



class ScriptRequest(BaseModel):
    brand_id: str
    idea: dict


@app.post("/campaigns/script")
def campaign_script(
    data: ScriptRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    brand = db.query(Brand).filter(
        Brand.id == data.brand_id,
        Brand.workspace_id == user.workspace_id,
    ).first()

    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    brand_data = {
        "name": brand.name,
        "personality": brand.personality or {},
        "audience": brand.audience or {},
        "colors": brand.colors or {},
    }

    scenes = generate_script(brand_data, data.idea)

    if not scenes:
        raise HTTPException(status_code=500, detail="Failed to generate script")

    return {"scenes": scenes}


class MusicRequest(BaseModel):
    brand_id: str
    mood: str = "cinematic luxury ambient"
    duration: int = 30


@app.post("/campaigns/music")
def campaign_music(
    data: MusicRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    brand = db.query(Brand).filter(
        Brand.id == data.brand_id,
        Brand.workspace_id == user.workspace_id,
    ).first()

    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    mood = data.mood
    duration = min(max(data.duration, 10), 120)
    prompt = "Cinematic luxury brand music, " + mood + ", elegant, warm, professional advertising soundtrack"

    url = generate_scene_music(prompt, duration)
    if not url:
        raise HTTPException(status_code=500, detail="Failed to generate music")

    return {"music_url": url}
