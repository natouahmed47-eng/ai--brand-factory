


# ============ Campaigns ============
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
