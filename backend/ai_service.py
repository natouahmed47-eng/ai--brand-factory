import os
import json
from openai import OpenAI
import replicate
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)


def generate_creative_ideas(brand, product=None):
    prompt = "You are a professional creative director. Analyze this brand: " + str(brand)
    prompt += "\n\nSuggest 5 creative short video ad ideas (15-30 sec)."
    prompt += "\n\nReply ONLY in JSON:"
    prompt += chr(10) + chr(123) + chr(34) + "ideas" + chr(34) + ": [" + chr(123) + chr(34) + "title" + chr(34) + ": " + chr(34) + "..." + chr(34) + ", " + chr(34) + "description" + chr(34) + ": " + chr(34) + "..." + chr(34) + ", " + chr(34) + "content_type" + chr(34) + ": " + chr(34) + "..." + chr(34) + ", " + chr(34) + "duration" + chr(34) + ": 15, " + chr(34) + "tone" + chr(34) + ": " + chr(34) + "..." + chr(34) + chr(125) + "]" + chr(125)
    prompt += "\n\nWrite all text in Arabic."

    response = client.chat.completions.create(
        model="openai/gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.9,
    )

    text = response.choices[0].message.content.strip()
    print("[AI_RAW_RESPONSE_START]")
    print(text[:500])
    print("[AI_RAW_RESPONSE_END]")

    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

    try:
        return json.loads(text).get("ideas", [])
    except Exception as e:
        print("[AI_PARSE_ERROR] " + str(e))
        return []




def generate_script(brand, idea):
    """يولّد سكريبت مشاهد من فكرة مختارة"""

    duration = idea.get("duration", 15)
    num_scenes = 4 if duration <= 15 else 5 if duration <= 20 else 6

    personality = brand.get("personality") or {}
    audience = brand.get("audience") or {}

    parts = []
    parts.append("You are a professional scriptwriter for video ads.")
    parts.append("")
    parts.append("Idea: " + str(idea.get("title", "")) + " - " + str(idea.get("description", "")))
    parts.append("Content type: " + str(idea.get("content_type", "")))
    parts.append("Tone: " + str(idea.get("tone", "")))
    parts.append("Total duration: " + str(duration) + " seconds")
    parts.append("Brand: " + str(brand.get("name", "")))
    parts.append("Brand tones: " + ", ".join(personality.get("tone", [])))
    parts.append("Brand emotion: " + str(personality.get("emotional_territory", "")))
    parts.append("Audience: " + str(audience.get("age_range", "")) + " " + str(audience.get("gender", "")))
    parts.append("Market: " + str(audience.get("market", "")))
    parts.append("Language: " + str(audience.get("language", "")) + " " + str(audience.get("dialect", "")))
    parts.append("")
    parts.append("Create exactly " + str(num_scenes) + " scenes. Sum of durations = " + str(duration) + " seconds.")
    parts.append("")
    parts.append("For each scene, provide:")
    parts.append("- number: scene number (1, 2, 3...)")
    parts.append("- duration: seconds (integer)")
    parts.append("- visual: what appears on screen (description in Arabic)")
    parts.append("- voice_over: narrator text in Arabic")
    parts.append("- on_screen_text: short text overlay in Arabic (max 5 words)")
    parts.append("")
    parts.append('Reply ONLY in this JSON format:')
    parts.append('{"scenes": [{"number": 1, "duration": 3, "visual": "...", "voice_over": "...", "on_screen_text": "..."}]}')
    parts.append("")
    parts.append("All text must be in Arabic. Reply ONLY with JSON, no other text.")

    prompt = "\n".join(parts)

    try:
        response = client.chat.completions.create(
            model="openai/gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8,
        )

        text = response.choices[0].message.content.strip()

        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()

        try:
            data = json.loads(text)
            return data.get("scenes", [])
        except Exception as e:
            print("[SCRIPT_PARSE_ERROR] " + str(e))
            return []

    except Exception as e:
        print("[SCRIPT_AI_ERROR] " + str(e))
        return []



def generate_scene_image(visual_description, brand_colors=None, aspect_ratio="9:16"):
    """يولّد صورة لمشهد باستخدام Flux Schnell"""

    colors_str = ""
    if brand_colors:
        colors_str = " Brand color palette: " + ", ".join(brand_colors) + "."

    prompt = (
        "Professional cinematic advertising photograph. "
        + str(visual_description)
        + colors_str
        + " High quality, 8k, commercial product photography style, "
        + "professional lighting, elegant composition."
    )

    try:
        import os
        from dotenv import load_dotenv
        load_dotenv()
        token = os.getenv("REPLICATE_API_TOKEN")
        client = replicate.Client(api_token=token, timeout=120.0)
        output = client.run(
            "black-forest-labs/flux-schnell",
            input={
                "prompt": prompt,
                "aspect_ratio": aspect_ratio,
                "output_format": "webp",
                "output_quality": 80,
                "num_outputs": 1,
            },
        )

        if output and len(output) > 0:
            return str(output[0])
        return None

    except Exception as e:
        print("[IMAGE_GEN_ERROR] " + str(e))
        return None

def generate_scene_image(visual_description, brand_colors=None, aspect_ratio="9:16"):
    import requests
    import time
    import os
    from dotenv import load_dotenv
    load_dotenv()

    token = os.getenv("REPLICATE_API_TOKEN")

    colors_str = ""
    if brand_colors:
        colors_str = " Brand color palette: " + ", ".join(brand_colors) + "."

    prompt = (
        "Professional cinematic advertising photograph. "
        + str(visual_description)
        + colors_str
        + " High quality, 8k, commercial product photography style, "
        + "professional lighting, elegant composition."
    )

    try:
        start = requests.post(
            "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",
            headers={
                "Authorization": "Token " + token,
                "Content-Type": "application/json",
            },
            json={
                "input": {
                    "prompt": prompt,
                    "aspect_ratio": aspect_ratio,
                    "output_format": "webp",
                    "output_quality": 80,
                    "num_outputs": 1,
                }
            },
            timeout=60,
        )

        if start.status_code != 201:
            print("[IMAGE_GEN_ERROR] Start failed: " + str(start.status_code) + " " + start.text[:200])
            return None

        prediction = start.json()
        prediction_id = prediction["id"]
        print("[IMAGE_GEN] Started: " + prediction_id)

        for i in range(100):
            time.sleep(3)
            check = requests.get(
                "https://api.replicate.com/v1/predictions/" + prediction_id,
                headers={"Authorization": "Token " + token},
                timeout=60,
            )
            data = check.json()
            status = data.get("status")
            print("[IMAGE_GEN] Status: " + str(status))

            if status == "succeeded":
                output = data.get("output", [])
                if output and len(output) > 0:
                    import uuid
                    from pathlib import Path as P
                    remote_url = str(output[0])
                    filename = str(uuid.uuid4()) + ".webp"
                    folder = P("uploads/scenes")
                    folder.mkdir(parents=True, exist_ok=True)
                    local_path = folder / filename

                    img = requests.get(remote_url, timeout=120)
                    with open(local_path, "wb") as f:
                        f.write(img.content)

                    return "/uploads/scenes/" + filename
                return None
            elif status == "failed" or status == "canceled":
                print("[IMAGE_GEN_ERROR] Failed: " + str(data.get("error")))
                return None

        print("[IMAGE_GEN_ERROR] Timeout after 300s")
        return None

    except Exception as e:
        print("[IMAGE_GEN_ERROR] " + str(e))
        return None
