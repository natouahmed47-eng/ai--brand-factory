import os
import uuid
import threading
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
from ai_service import generate_creative_ideas, generate_script, generate_captions, generate_scene_music

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


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String, ForeignKey("workspaces.id"))
    brand_id: Mapped[str] = mapped_column(String, ForeignKey("brands.id"))
    idea: Mapped[dict] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String, default="pending")
    stage: Mapped[str] = mapped_column(String, default="")
    scenes: Mapped[dict] = mapped_column(JSON, nullable=True)
    assets: Mapped[dict] = mapped_column(JSON, nullable=True)
    final_url: Mapped[str] = mapped_column(String, nullable=True)
    error: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String, ForeignKey("workspaces.id"))
    brand_id: Mapped[str] = mapped_column(String, ForeignKey("brands.id"))
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String, nullable=True)
    price: Mapped[str] = mapped_column(String, nullable=True)
    images: Mapped[dict] = mapped_column(JSON, nullable=True)
    features: Mapped[dict] = mapped_column(JSON, nullable=True)
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
    product_id: str | None = None


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

    product_data = None
    if data.product_id:
        prod = db.query(Product).filter(
            Product.id == data.product_id,
            Product.workspace_id == user.workspace_id,
        ).first()
        if prod:
            product_data = {
                "name": prod.name,
                "description": prod.description,
                "price": prod.price,
                "images": prod.images or [],
            }

    ideas = generate_creative_ideas(brand_data, product_data)

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


class CaptionsRequest(BaseModel):
    brand_id: str
    scenes: list


@app.post("/campaigns/captions")
def campaign_captions(
    data: CaptionsRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    brand = db.query(Brand).filter(
        Brand.id == data.brand_id,
        Brand.workspace_id == user.workspace_id,
    ).first()

    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    url = generate_captions(data.scenes)
    if not url:
        raise HTTPException(status_code=500, detail="Failed to generate captions")

    return {"captions_url": url}


# ============ Campaigns Production ============
def _run_pipeline_thread(campaign_id: str):
    from ai_service import full_production_pipeline
    db = SessionLocal()
    try:
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            return
        brand = db.query(Brand).filter(Brand.id == campaign.brand_id).first()
        if not brand:
            campaign.status = "failed"
            campaign.error = "Brand not found"
            db.commit()
            return

        brand_data = {
            "name": brand.name,
            "personality": brand.personality or {},
            "audience": brand.audience or {},
            "colors": brand.colors or {},
        }

        def update_progress(stage, status, detail):
            try:
                local_db = SessionLocal()
                cc = local_db.query(Campaign).filter(Campaign.id == campaign_id).first()
                if cc:
                    cc.stage = str(stage) + " | " + str(status) + ((" | " + str(detail)) if detail else "")
                    local_db.commit()
                local_db.close()
            except Exception as e:
                print("[PROGRESS_ERR] " + str(e))

        product_data = None
        product_id = (campaign.idea or {}).get("_product_id")
        if product_id:
            prod = db.query(Product).filter(Product.id == product_id).first()
            if prod:
                product_data = {
                    "name": prod.name,
                    "description": prod.description,
                    "price": prod.price,
                    "images": prod.images or [],
                }

        campaign.status = "running"
        db.commit()

        result = full_production_pipeline(brand_data, campaign.idea or {}, product=product_data, progress_callback=update_progress)

        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if result.get("final_url"):
            campaign.status = "done"
            campaign.final_url = result.get("final_url")
        else:
            campaign.status = "failed"
        import json as _json2
        scenes_json = _json2.dumps(result.get("scenes") or [])
        assets_json = _json2.dumps(result.get("assets") or {})
        error_val = "; ".join(result.get("errors", [])) or None
        db.execute(
            text("UPDATE campaigns SET scenes = CAST(:s AS jsonb), assets = CAST(:a AS jsonb), error = :e, stage = 'complete' WHERE id = :id"),
            {"s": scenes_json, "a": assets_json, "e": error_val, "id": campaign_id}
        )
        db.commit()
    except Exception as e:
        print("[PIPELINE_THREAD_ERR] " + str(e))
        try:
            campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
            if campaign:
                campaign.status = "failed"
                campaign.error = str(e)
                db.commit()
        except:
            pass
    finally:
        db.close()


class CreateCampaignRequest(BaseModel):
    brand_id: str
    product_id: str | None = None
    idea: dict


@app.post("/campaigns")
def create_campaign(
    data: CreateCampaignRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    brand = db.query(Brand).filter(
        Brand.id == data.brand_id,
        Brand.workspace_id == user.workspace_id,
    ).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    idea_with_product = dict(data.idea)
    if data.product_id:
        idea_with_product["_product_id"] = data.product_id

    campaign = Campaign(
        workspace_id=user.workspace_id,
        brand_id=data.brand_id,
        idea=idea_with_product,
        status="pending",
        stage="starting",
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    thread = threading.Thread(target=_run_pipeline_thread, args=(campaign.id,), daemon=True)
    thread.start()

    return {"id": campaign.id, "status": campaign.status, "stage": campaign.stage}


@app.get("/campaigns")
def list_campaigns(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaigns = db.query(Campaign).filter(Campaign.workspace_id == user.workspace_id).order_by(Campaign.created_at.desc()).all()
    return [
        {
            "id": cc.id,
            "brand_id": cc.brand_id,
            "status": cc.status,
            "stage": cc.stage,
            "final_url": cc.final_url,
            "created_at": cc.created_at.isoformat(),
        }
        for cc in campaigns
    ]


@app.get("/campaigns/{campaign_id}")
def get_campaign(
    campaign_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.workspace_id == user.workspace_id,
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    return {
        "id": campaign.id,
        "brand_id": campaign.brand_id,
        "idea": campaign.idea,
        "status": campaign.status,
        "stage": campaign.stage,
        "scenes": campaign.scenes,
        "assets": campaign.assets,
        "final_url": campaign.final_url,
        "error": campaign.error,
        "created_at": campaign.created_at.isoformat(),
    }


# ============ Scene Regeneration ============
class RegenerateSceneRequest(BaseModel):
    brand_id: str


@app.post("/campaigns/{campaign_id}/scenes/{scene_number}/regenerate")
def regenerate_scene(
    campaign_id: str,
    scene_number: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from ai_service import generate_scene_image, generate_scene_video, generate_scene_voice, merge_scene

    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.workspace_id == user.workspace_id,
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    brand = db.query(Brand).filter(Brand.id == campaign.brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    scenes = campaign.scenes or []
    scene_index = None
    for idx, sc in enumerate(scenes):
        if sc.get("number") == scene_number:
            scene_index = idx
            break

    if scene_index is None:
        raise HTTPException(status_code=404, detail="Scene not found")

    scene = scenes[scene_index]
    brand_colors = (brand.colors or {}).get("palette") or []

    # Regenerate image
    print("[REGEN] Image for scene " + str(scene_number))
    new_image = generate_scene_image(
        visual_description=scene.get("visual", ""),
        brand_colors=brand_colors,
        aspect_ratio="9:16",
    )
    if new_image:
        scene["image_url"] = new_image

    # Regenerate video
    print("[REGEN] Video for scene " + str(scene_number))
    new_video = generate_scene_video(
        visual_description=scene.get("visual", ""),
        duration=scene.get("duration", 3),
        brand_colors=brand_colors,
        aspect_ratio="9:16",
    )
    if new_video:
        scene["video_url"] = new_video

    # Regenerate voice
    voice_text = scene.get("voice_over", "")
    if voice_text:
        print("[REGEN] Voice for scene " + str(scene_number))
        new_voice = generate_scene_voice(voice_text)
        if new_voice:
            scene["voice_url"] = new_voice

    # Merge
    if scene.get("video_url") and scene.get("voice_url"):
        print("[REGEN] Merge for scene " + str(scene_number))
        merged = merge_scene("." + scene["video_url"], "." + scene["voice_url"])
        if merged:
            scene["merged_url"] = merged

    import json as _json
    scenes[scene_index] = scene
    scenes_json = _json.dumps(scenes)
    db.execute(
        text("UPDATE campaigns SET scenes = CAST(:s AS jsonb) WHERE id = :id"),
        {"s": scenes_json, "id": campaign_id}
    )
    db.commit()
    db.refresh(campaign)

    return {
        "success": True,
        "scene": scene,
    }


@app.post("/campaigns/{campaign_id}/rebuild")
def rebuild_campaign(
    campaign_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from ai_service import (
        combine_videos,
        generate_scene_music,
        generate_captions,
        add_music_to_video,
        add_captions_to_video,
    )

    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.workspace_id == user.workspace_id,
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    brand = db.query(Brand).filter(Brand.id == campaign.brand_id).first()
    scenes = campaign.scenes or []

    # Collect merged scene paths
    merged_paths = []
    for sc in scenes:
        if sc.get("merged_url"):
            merged_paths.append("." + sc["merged_url"])

    if not merged_paths:
        raise HTTPException(status_code=400, detail="No merged scenes available")

    # Combine
    combined = combine_videos(merged_paths)
    if not combined:
        raise HTTPException(status_code=500, detail="Combine failed")

    # Music
    total_duration = sum(sc.get("duration", 3) for sc in scenes)
    mood = "cinematic luxury ambient"
    if brand and brand.personality:
        if brand.personality.get("emotional_territory"):
            mood = "cinematic " + str(brand.personality.get("emotional_territory"))
    music_prompt = "Cinematic luxury brand music, " + mood + ", elegant, warm, professional advertising soundtrack"
    music_url = generate_scene_music(music_prompt, duration=min(int(total_duration), 120))

    # Add music
    with_music = combined
    if music_url:
        result_music = add_music_to_video("." + combined, "." + music_url)
        if result_music:
            with_music = result_music

    # Captions
    srt_url = generate_captions(scenes)
    final_url = None
    if srt_url:
        final_url = add_captions_to_video("." + with_music, "." + srt_url)

    import json as _json3
    assets_new = {
        "music_url": music_url,
        "captions_url": srt_url,
        "combined_url": combined,
        "with_music_url": with_music,
    }
    assets_json = _json3.dumps(assets_new)
    new_status = "done" if final_url else campaign.status
    db.execute(
        text("UPDATE campaigns SET final_url = :f, assets = CAST(:a AS jsonb), status = :st, error = NULL WHERE id = :id"),
        {"f": final_url, "a": assets_json, "st": new_status, "id": campaign_id}
    )
    db.commit()
    db.refresh(campaign)

    return {
        "success": True,
        "final_url": final_url,
        "campaign_id": campaign.id,
    }


@app.post("/campaigns/{campaign_id}/formats")
def campaign_formats(
    campaign_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from ai_service import generate_video_formats

    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.workspace_id == user.workspace_id,
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if not campaign.final_url:
        raise HTTPException(status_code=400, detail="No final video yet")

    # تحقق إذا كانت الصيغ موجودة
    assets = campaign.assets or {}
    if assets.get("formats"):
        return {"formats": assets["formats"]}

    # ولّد الصيغ
    result = generate_video_formats("." + campaign.final_url, base_name=campaign.id)

    if not result:
        raise HTTPException(status_code=500, detail="Failed to generate formats")

    assets["formats"] = result
    campaign.assets = assets
    db.commit()

    return {"formats": result}


# ============ Products ============
class CreateProductRequest(BaseModel):
    brand_id: str
    name: str
    description: str | None = None
    price: str | None = None
    features: list | None = None


def serialize_product(product: Product) -> dict:
    return {
        "id": product.id,
        "brand_id": product.brand_id,
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "images": product.images or [],
        "features": product.features or [],
        "created_at": product.created_at.isoformat(),
    }


@app.post("/products")
def create_product(
    data: CreateProductRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    brand = db.query(Brand).filter(
        Brand.id == data.brand_id,
        Brand.workspace_id == user.workspace_id,
    ).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    product = Product(
        workspace_id=user.workspace_id,
        brand_id=data.brand_id,
        name=data.name,
        description=data.description,
        price=data.price,
        images=[],
        features=data.features or [],
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return serialize_product(product)


@app.get("/brands/{brand_id}/products")
def list_products(
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

    products = db.query(Product).filter(Product.brand_id == brand_id).order_by(Product.created_at.desc()).all()
    return [serialize_product(pp) for pp in products]


@app.get("/products/{product_id}")
def get_product(
    product_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.workspace_id == user.workspace_id,
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize_product(product)


@app.post("/products/{product_id}/images")
def upload_product_image(
    product_id: str,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.workspace_id == user.workspace_id,
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    ext = Path(file.filename).suffix.lower()
    if ext not in [".png", ".jpg", ".jpeg", ".webp"]:
        raise HTTPException(status_code=400, detail="Only image files allowed")

    filename = product_id + "_" + str(uuid.uuid4())[:8] + ext
    folder = Path("uploads/products")
    folder.mkdir(parents=True, exist_ok=True)
    filepath = folder / filename

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    images = list(product.images or [])
    images.append("/uploads/products/" + filename)
    product.images = images
    flag_modified(product, "images")
    db.commit()
    db.refresh(product)

    return serialize_product(product)


@app.delete("/products/{product_id}")
def delete_product(
    product_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.workspace_id == user.workspace_id,
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"success": True}
