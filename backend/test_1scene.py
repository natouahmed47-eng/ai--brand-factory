from ai_service import full_production_pipeline

brand = {
    "name": "dadi",
    "personality": {"tone": ["فاخر", "أنيق"], "communication_style": "قصصي", "emotional_territory": "فخامة"},
    "audience": {"age_range": "25-34", "gender": "الاثنين", "market": "السعودية", "language": "عربي", "dialect": "خليجي"},
    "colors": {"palette": ["#000000", "#432a64"]},
}

product = {
    "name": "عطر دادي الفاخر",
    "description": "عطر شرقي فاخر بمكونات نادرة",
    "price": "850 ريال",
    "images": [],
}

idea = {
    "title": "لحظة الاكتشاف",
    "description": "لقطة سينمائية للعطر على رخام",
    "content_type": "سينمائي",
    "duration": 5,
    "tone": "فاخر",
}

print("=" * 60)
print("TEST MODE: 1 scene only")
print("=" * 60)

result = full_production_pipeline(brand, idea, product=product, max_scenes=1)

print()
print("=" * 60)
print("FINAL URL:", result.get("final_url"))
print("ERRORS:", result.get("errors"))
print("=" * 60)
