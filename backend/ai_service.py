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

def generate_scene_video(visual_description, duration=5, brand_colors=None, aspect_ratio="9:16"):
    import requests
    import time
    import os
    import uuid
    from pathlib import Path
    from dotenv import load_dotenv
    load_dotenv()

    token = os.getenv("REPLICATE_API_TOKEN")

    colors_str = ""
    if brand_colors:
        colors_str = " Brand color palette: " + ", ".join(brand_colors) + "."

    prompt = (
        "Cinematic advertising video. "
        + str(visual_description)
        + colors_str
        + " Professional lighting, smooth camera movement, high quality."
    )

    try:
        start = requests.post(
            "https://api.replicate.com/v1/models/minimax/video-01/predictions",
            headers={
                "Authorization": "Token " + token,
                "Content-Type": "application/json",
            },
            json={
                "input": {
                    "prompt": prompt,
                    "prompt_optimizer": True,
                }
            },
            timeout=60,
        )

        if start.status_code != 201:
            print("[VIDEO_GEN_ERROR] Start failed: " + str(start.status_code) + " " + start.text[:300])
            return None

        prediction = start.json()
        prediction_id = prediction["id"]
        print("[VIDEO_GEN] Started: " + prediction_id)

        for i in range(200):
            time.sleep(5)
            check = requests.get(
                "https://api.replicate.com/v1/predictions/" + prediction_id,
                headers={"Authorization": "Token " + token},
                timeout=60,
            )
            data = check.json()
            status = data.get("status")
            print("[VIDEO_GEN] Status: " + str(status))

            if status == "succeeded":
                output = data.get("output")
                if isinstance(output, list) and len(output) > 0:
                    remote_url = str(output[0])
                elif isinstance(output, str):
                    remote_url = output
                else:
                    print("[VIDEO_GEN_ERROR] Unexpected output format")
                    return None

                filename = str(uuid.uuid4()) + ".mp4"
                folder = Path("uploads/videos")
                folder.mkdir(parents=True, exist_ok=True)
                local_path = folder / filename

                video_data = requests.get(remote_url, timeout=300)
                with open(local_path, "wb") as f:
                    f.write(video_data.content)

                return "/uploads/videos/" + filename

            elif status == "failed" or status == "canceled":
                print("[VIDEO_GEN_ERROR] Failed: " + str(data.get("error")))
                return None

        print("[VIDEO_GEN_ERROR] Timeout after 1000s")
        return None

    except Exception as e:
        print("[VIDEO_GEN_ERROR] " + str(e))
        return None


def generate_scene_voice(text, voice_id="English_Wiselady", language_boost="Arabic", emotion="auto"):
    import requests
    import time
    import os
    import uuid
    from pathlib import Path
    from dotenv import load_dotenv
    load_dotenv()

    token = os.getenv("REPLICATE_API_TOKEN")

    try:
        start = requests.post(
            "https://api.replicate.com/v1/models/minimax/speech-2.8-hd/predictions",
            headers={
                "Authorization": "Token " + token,
                "Content-Type": "application/json",
            },
            json={
                "input": {
                    "text": text,
                    "voice_id": voice_id,
                    "language_boost": language_boost,
                    "emotion": emotion,
                    "audio_format": "mp3",
                    "sample_rate": 32000,
                    "bitrate": 128000,
                    "channel": "mono",
                }
            },
            timeout=60,
        )

        if start.status_code != 201:
            print("[VOICE_GEN_ERROR] Start failed: " + str(start.status_code) + " " + start.text[:300])
            return None

        prediction = start.json()
        prediction_id = prediction["id"]
        print("[VOICE_GEN] Started: " + prediction_id)

        for i in range(60):
            time.sleep(2)
            check = requests.get(
                "https://api.replicate.com/v1/predictions/" + prediction_id,
                headers={"Authorization": "Token " + token},
                timeout=60,
            )
            data = check.json()
            status = data.get("status")
            print("[VOICE_GEN] Status: " + str(status))

            if status == "succeeded":
                output = data.get("output")
                remote_url = None
                if isinstance(output, list) and len(output) > 0:
                    remote_url = str(output[0])
                elif isinstance(output, str):
                    remote_url = output
                elif isinstance(output, dict) and "url" in output:
                    remote_url = str(output["url"])

                if not remote_url:
                    print("[VOICE_GEN_ERROR] No audio URL in output")
                    return None

                filename = str(uuid.uuid4()) + ".mp3"
                folder = Path("uploads/voices")
                folder.mkdir(parents=True, exist_ok=True)
                local_path = folder / filename

                audio_data = requests.get(remote_url, timeout=120)
                with open(local_path, "wb") as f:
                    f.write(audio_data.content)

                return "/uploads/voices/" + filename

            elif status == "failed" or status == "canceled":
                print("[VOICE_GEN_ERROR] Failed: " + str(data.get("error")))
                return None

        print("[VOICE_GEN_ERROR] Timeout after 120s")
        return None

    except Exception as e:
        print("[VOICE_GEN_ERROR] " + str(e))
        return None


def generate_scene_voice(text, voice="Aria", language_code="ar"):
    import requests
    import time
    import os
    import uuid
    from pathlib import Path
    from dotenv import load_dotenv
    load_dotenv()

    token = os.getenv("REPLICATE_API_TOKEN")

    try:
        start = requests.post(
            "https://api.replicate.com/v1/models/elevenlabs/v2-multilingual/predictions",
            headers={
                "Authorization": "Token " + token,
                "Content-Type": "application/json",
            },
            json={
                "input": {
                    "prompt": text,
                    "voice": voice,
                    "language_code": language_code,
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                    "style": 0,
                    "speed": 1,
                }
            },
            timeout=60,
        )

        if start.status_code != 201:
            print("[VOICE_GEN_ERROR] Start failed: " + str(start.status_code))
            return None

        prediction = start.json()
        prediction_id = prediction["id"]
        print("[VOICE_GEN] Started: " + prediction_id)

        for i in range(60):
            time.sleep(2)
            check = requests.get(
                "https://api.replicate.com/v1/predictions/" + prediction_id,
                headers={"Authorization": "Token " + token},
                timeout=60,
            )
            data = check.json()
            status = data.get("status")
            print("[VOICE_GEN] Status: " + str(status))

            if status == "succeeded":
                output = data.get("output")
                remote_url = str(output) if output else None
                if not remote_url:
                    print("[VOICE_GEN_ERROR] No URL")
                    return None

                filename = str(uuid.uuid4()) + ".mp3"
                folder = Path("uploads/voices")
                folder.mkdir(parents=True, exist_ok=True)
                local_path = folder / filename

                audio_data = requests.get(remote_url, timeout=120)
                with open(local_path, "wb") as f:
                    f.write(audio_data.content)

                return "/uploads/voices/" + filename

            elif status in ["failed", "canceled"]:
                print("[VOICE_GEN_ERROR] Failed")
                return None

        return None

    except Exception as e:
        print("[VOICE_GEN_ERROR] " + str(e))
        return None


def generate_scene_voice(text, voice_id="CwhRBWXzGAHq8TQ4Fs17", model="eleven_v3", stability=0.4, similarity_boost=0.85, style=0.6, speed=1.0):
    import os
    import uuid
    from pathlib import Path
    from dotenv import load_dotenv
    from elevenlabs.client import ElevenLabs

    load_dotenv()

    api_key = os.getenv("ELEVENLABS_API_KEY")
    client = ElevenLabs(api_key=api_key)

    try:
        audio = client.text_to_speech.convert(
            voice_id=voice_id,
            text=text,
            model_id=model,
            voice_settings={
                "stability": stability,
                "similarity_boost": similarity_boost,
                "style": style,
                "use_speaker_boost": True,
                "speed": speed,
            },
        )

        filename = str(uuid.uuid4()) + ".mp3"
        folder = Path("uploads/voices")
        folder.mkdir(parents=True, exist_ok=True)
        local_path = folder / filename

        with open(local_path, "wb") as f:
            for chunk in audio:
                f.write(chunk)

        return "/uploads/voices/" + filename

    except Exception as e:
        print("[VOICE_GEN_ERROR] " + str(e))
        return None


def generate_scene_music(prompt, duration=30):
    import requests
    import time
    import os
    import uuid
    from pathlib import Path
    from dotenv import load_dotenv
    load_dotenv()

    token = os.getenv("REPLICATE_API_TOKEN")

    try:
        start = requests.post(
            "https://api.replicate.com/v1/models/stability-ai/stable-audio-2.5/predictions",
            headers={"Authorization": "Token " + token, "Content-Type": "application/json"},
            json={"input": {"prompt": prompt, "duration": duration}},
            timeout=60,
        )

        if start.status_code != 201:
            print("[MUSIC_GEN_ERROR] Start failed: " + str(start.status_code))
            return None

        prediction = start.json()
        prediction_id = prediction["id"]
        print("[MUSIC_GEN] Started: " + prediction_id)

        for i in range(120):
            time.sleep(3)
            check = requests.get(
                "https://api.replicate.com/v1/predictions/" + prediction_id,
                headers={"Authorization": "Token " + token},
                timeout=60,
            )
            data = check.json()
            status = data.get("status")
            print("[MUSIC_GEN] Status: " + str(status))

            if status == "succeeded":
                output = data.get("output")
                remote_url = None
                if isinstance(output, list) and output:
                    remote_url = str(output[0])
                elif isinstance(output, str):
                    remote_url = output
                if not remote_url:
                    return None

                filename = str(uuid.uuid4()) + ".mp3"
                folder = Path("uploads/music")
                folder.mkdir(parents=True, exist_ok=True)
                local_path = folder / filename

                audio_data = requests.get(remote_url, timeout=120)
                with open(local_path, "wb") as f:
                    f.write(audio_data.content)

                return "/uploads/music/" + filename

            elif status in ["failed", "canceled"]:
                print("[MUSIC_GEN_ERROR] Failed")
                return None

        return None

    except Exception as e:
        print("[MUSIC_GEN_ERROR] " + str(e))
        return None


def generate_captions(scenes, language="ar"):
    import uuid
    from pathlib import Path

    try:
        folder = Path("uploads/captions")
        folder.mkdir(parents=True, exist_ok=True)

        filename = str(uuid.uuid4()) + ".srt"
        filepath = folder / filename

        def format_time(seconds):
            ms = int((seconds % 1) * 1000)
            s = int(seconds) % 60
            m = (int(seconds) // 60) % 60
            h = int(seconds) // 3600
            return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

        lines = []
        current_time = 0.0

        for i, scene in enumerate(scenes, start=1):
            duration = float(scene.get("duration", 3))
            start_time = current_time
            end_time = current_time + duration
            current_time = end_time

            text = scene.get("voice_over") or scene.get("on_screen_text") or ""
            text = str(text).strip()
            if not text:
                continue

            lines.append(str(i))
            lines.append(format_time(start_time) + " --> " + format_time(end_time))
            lines.append(text)
            lines.append("")

        with open(filepath, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))

        return "/uploads/captions/" + filename

    except Exception as e:
        print("[CAPTIONS_ERROR] " + str(e))
        return None


def combine_videos(video_paths, output_name=None):
    """???? ??? ???????? ?? ????? ???? (???? ???)"""
    import subprocess
    import uuid
    from pathlib import Path
    import imageio_ffmpeg

    try:
        if not video_paths or len(video_paths) == 0:
            return None

        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

        folder = Path("uploads/final")
        folder.mkdir(parents=True, exist_ok=True)

        if output_name is None:
            output_name = str(uuid.uuid4()) + ".mp4"

        # ??? list ?????
        list_file = folder / (output_name + ".txt")
        with open(list_file, "w", encoding="utf-8") as f:
            for vp in video_paths:
                abs_path = str(Path(vp).absolute())
                f.write("file '" + abs_path.replace("\\", "/") + "'\n")

        output_path = folder / output_name

        cmd = [
            ffmpeg_exe,
            "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(list_file),
            "-c", "copy",
            str(output_path),
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

        if result.returncode != 0:
            print("[EDIT_ERROR] " + result.stderr[-500:])
            return None

        list_file.unlink()
        return "/uploads/final/" + output_name

    except Exception as e:
        print("[EDIT_ERROR] " + str(e))
        return None


def merge_scene(video_path, voice_path, output_name=None):
    """???? ????? ?????? ?? ????? (Voice Over)"""
    import subprocess
    import uuid
    from pathlib import Path
    import imageio_ffmpeg

    try:
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

        folder = Path("uploads/scenes_merged")
        folder.mkdir(parents=True, exist_ok=True)

        if output_name is None:
            output_name = str(uuid.uuid4()) + ".mp4"

        output_path = folder / output_name

        video_abs = str(Path(video_path).absolute())
        voice_abs = str(Path(voice_path).absolute())

        cmd = [
            ffmpeg_exe,
            "-y",
            "-i", video_abs,
            "-i", voice_abs,
            "-c:v", "copy",
            "-c:a", "aac",
            "-shortest",
            "-map", "0:v:0",
            "-map", "1:a:0",
            str(output_path),
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

        if result.returncode != 0:
            print("[MERGE_ERROR] " + result.stderr[-800:])
            return None

        return "/uploads/scenes_merged/" + output_name

    except Exception as e:
        print("[MERGE_ERROR] " + str(e))
        return None


def merge_with_music(video_path, voice_path, music_path, output_name=None):
    """???? ????? + ??? + ?????? (???????? ?? ??????? ????? 20%)"""
    import subprocess
    import uuid
    from pathlib import Path
    import imageio_ffmpeg

    try:
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

        folder = Path("uploads/scenes_merged")
        folder.mkdir(parents=True, exist_ok=True)

        if output_name is None:
            output_name = str(uuid.uuid4()) + ".mp4"

        output_path = folder / output_name

        video_abs = str(Path(video_path).absolute())
        voice_abs = str(Path(voice_path).absolute())
        music_abs = str(Path(music_path).absolute())

        cmd = [
            ffmpeg_exe,
            "-y",
            "-i", video_abs,
            "-i", voice_abs,
            "-i", music_abs,
            "-filter_complex",
            "[1:a]volume=1.0[voice];[2:a]volume=0.2[music];[voice][music]amix=inputs=2:duration=first:dropout_transition=2[aout]",
            "-map", "0:v:0",
            "-map", "[aout]",
            "-c:v", "copy",
            "-c:a", "aac",
            "-shortest",
            str(output_path),
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)

        if result.returncode != 0:
            print("[MUSIC_MERGE_ERROR] " + result.stderr[-800:])
            return None

        return "/uploads/scenes_merged/" + output_name

    except Exception as e:
        print("[MUSIC_MERGE_ERROR] " + str(e))
        return None


def add_captions_to_video(video_path, srt_path, output_name=None):
    """???? Captions ?????? ??? ???????"""
    import subprocess
    import uuid
    import shutil
    from pathlib import Path
    import imageio_ffmpeg

    try:
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

        folder = Path("uploads/scenes_merged")
        folder.mkdir(parents=True, exist_ok=True)

        if output_name is None:
            output_name = str(uuid.uuid4()) + "_captioned.mp4"

        # ???????? ???????
        video_abs = str(Path(video_path).resolve())
        srt_src = Path(srt_path).resolve()

        # ??? SRT ??? ???? ????? ???? ????
        srt_local_name = "temp_subtitles_" + str(uuid.uuid4())[:8] + ".srt"
        srt_local_path = folder / srt_local_name
        shutil.copy(str(srt_src), str(srt_local_path))

        # ?????? ??? ????? ??? (??? cwd ????? ??????)
        style = "FontName=Tahoma,FontSize=10,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3,Outline=2,Shadow=1,MarginV=40,Alignment=2,Bold=1"

        cmd = [
            ffmpeg_exe,
            "-y",
            "-i", video_abs,
            "-vf", "subtitles=" + srt_local_name + ":force_style='" + style + "'",
            "-c:a", "copy",
            output_name,
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=600,
            cwd=str(folder.resolve()),
        )

        # ??? SRT ??????
        try:
            srt_local_path.unlink()
        except:
            pass

        if result.returncode != 0:
            print("[CAPTIONS_VIDEO_ERROR] " + result.stderr[-800:])
            return None

        return "/uploads/scenes_merged/" + output_name

    except Exception as e:
        print("[CAPTIONS_VIDEO_ERROR] " + str(e))
        return None


def add_music_to_video(video_path, music_path, output_name=None):
    """???? ?????? ????? ?????? ????? (????? 20%)"""
    import subprocess
    import uuid
    from pathlib import Path
    import imageio_ffmpeg

    try:
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        folder = Path("uploads/scenes_merged")
        folder.mkdir(parents=True, exist_ok=True)

        if output_name is None:
            output_name = str(uuid.uuid4()) + "_music.mp4"

        output_path = folder / output_name
        video_abs = str(Path(video_path).resolve())
        music_abs = str(Path(music_path).resolve())

        cmd = [
            ffmpeg_exe, "-y",
            "-i", video_abs,
            "-i", music_abs,
            "-filter_complex",
            "[1:a]volume=0.2[music];[0:a][music]amix=inputs=2:duration=first:dropout_transition=2[aout]",
            "-map", "0:v:0",
            "-map", "[aout]",
            "-c:v", "copy",
            "-c:a", "aac",
            "-shortest",
            str(output_path),
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)

        if result.returncode != 0:
            print("[ADD_MUSIC_ERROR] " + result.stderr[-500:])
            return None

        return "/uploads/scenes_merged/" + output_name

    except Exception as e:
        print("[ADD_MUSIC_ERROR] " + str(e))
        return None


def full_production_pipeline(brand_data, idea, product=None, max_scenes=None, progress_callback=None):
    """?? ??????? ??????: ?? ???? ? ????? ?????"""
    result = {
        "stages": [],
        "scenes": [],
        "final_url": None,
        "assets": {},
        "errors": [],
    }

    def report(stage, status, detail=""):
        result["stages"].append({"stage": stage, "status": status, "detail": detail})
        print("[PIPELINE] " + stage + " | " + status + " | " + str(detail))
        if progress_callback:
            try:
                progress_callback(stage, status, detail)
            except:
                pass

    try:
        # Stage 1: Script
        report("script", "running")
        scenes_text = generate_script(brand_data, idea)
        if not scenes_text:
            result["errors"].append("Script generation failed")
            report("script", "failed")
            return result

        if max_scenes and len(scenes_text) > max_scenes:
            scenes_text = scenes_text[:max_scenes]
            print("[PIPELINE] Limited to " + str(max_scenes) + " scenes (test mode)")

        report("script", "done", str(len(scenes_text)) + " scenes")

        brand_colors = (brand_data.get("colors") or {}).get("palette") or []
        scene_videos_paths = []

        # Stage 2: Generate assets per scene
        for i, scene in enumerate(scenes_text, start=1):
            scene_result = {
                "number": scene.get("number", i),
                "duration": scene.get("duration", 3),
                "visual": scene.get("visual", ""),
                "voice_over": scene.get("voice_over", ""),
                "on_screen_text": scene.get("on_screen_text", ""),
                "image_url": None,
                "video_url": None,
                "voice_url": None,
                "merged_url": None,
            }

            # Image
            report("image", "running", "scene " + str(i))
            scene_visual = scene.get("visual", "")
            if product:
                product_context = product.get("name", "")
                if product.get("description"):
                    product_context += " - " + str(product.get("description"))
                scene_visual = product_context + ". " + scene_visual

            img = generate_scene_image_agnes(
                visual_description=scene_visual,
                brand_colors=brand_colors,
                aspect_ratio="9:16",
            )
            scene_result["image_url"] = img
            report("image", "done", "scene " + str(i))

            # Video
            report("video", "running", "scene " + str(i))
            vid = generate_scene_video_agnes(
                visual_description=scene_visual,
                duration=scene.get("duration", 3),
                brand_colors=brand_colors,
                aspect_ratio="9:16",
            )
            scene_result["video_url"] = vid
            report("video", "done", "scene " + str(i))

            # Voice
            voice_text = scene.get("voice_over", "")
            if voice_text:
                report("voice", "running", "scene " + str(i))
                voi = generate_scene_voice(voice_text)
                scene_result["voice_url"] = voi
                report("voice", "done", "scene " + str(i))

            # Merge scene video + voice
            if vid and scene_result["voice_url"]:
                report("merge_scene", "running", "scene " + str(i))
                merged = merge_scene("." + vid, "." + scene_result["voice_url"])
                scene_result["merged_url"] = merged
                if merged:
                    scene_videos_paths.append("." + merged)
                report("merge_scene", "done", "scene " + str(i))

            result["scenes"].append(scene_result)

        if not scene_videos_paths:
            result["errors"].append("No scene videos to combine")
            return result

        # Stage 3: Combine all scenes
        report("combine", "running")
        combined_url = combine_videos(scene_videos_paths)
        if not combined_url:
            result["errors"].append("Combine failed")
            report("combine", "failed")
            return result
        report("combine", "done")

        # Stage 4: Music
        report("music", "running")
        total_duration = sum(s.get("duration", 3) for s in scenes_text)
        mood = "cinematic luxury ambient"
        personality = brand_data.get("personality") or {}
        if personality.get("emotional_territory"):
            mood = "cinematic " + str(personality.get("emotional_territory"))
        music_prompt = "Cinematic luxury brand music, " + mood + ", elegant, warm, professional advertising soundtrack"
        music_url = generate_scene_music(music_prompt, duration=min(int(total_duration), 120))
        report("music", "done" if music_url else "failed")

        # Stage 5: Add music to combined
        final_with_music = combined_url
        if music_url:
            report("add_music", "running")
            final_with_music = add_music_to_video("." + combined_url, "." + music_url)
            report("add_music", "done" if final_with_music else "failed")

        # Stage 6: Captions
        report("captions", "running")
        srt_url = generate_captions(scenes_text)
        final_url = None
        if srt_url and final_with_music:
            final_url = add_captions_to_video("." + final_with_music, "." + srt_url)
        report("captions", "done" if final_url else "failed")

        result["final_url"] = final_url
        result["assets"] = {
            "music_url": music_url,
            "captions_url": srt_url,
            "combined_url": combined_url,
            "with_music_url": final_with_music,
        }

        report("pipeline", "done" if final_url else "failed")

    except Exception as e:
        result["errors"].append(str(e))
        print("[PIPELINE_ERROR] " + str(e))

    return result


def generate_video_formats(input_video_path, base_name=None):
    """يولّد 3 صيغ من فيديو واحد: 9:16, 1:1, 16:9"""
    import subprocess
    import uuid
    from pathlib import Path
    import imageio_ffmpeg

    try:
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        folder = Path("uploads/formats")
        folder.mkdir(parents=True, exist_ok=True)

        if base_name is None:
            base_name = str(uuid.uuid4())

        input_abs = str(Path(input_video_path).resolve())

        formats = [
            {"name": "vertical_9x16", "w": 1080, "h": 1920},
            {"name": "square_1x1", "w": 1080, "h": 1080},
            {"name": "landscape_16x9", "w": 1920, "h": 1080},
        ]

        results = {}

        for fmt in formats:
            output_name = base_name + "_" + fmt["name"] + ".mp4"
            output_path = folder / output_name

            vf = (
                "scale=" + str(fmt["w"]) + ":" + str(fmt["h"]) +
                ":force_original_aspect_ratio=decrease,"
                "pad=" + str(fmt["w"]) + ":" + str(fmt["h"]) +
                ":(ow-iw)/2:(oh-ih)/2:black"
            )

            cmd = [
                ffmpeg_exe, "-y",
                "-i", input_abs,
                "-vf", vf,
                "-c:a", "copy",
                "-preset", "fast",
                str(output_path),
            ]

            result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
            if result.returncode == 0:
                results[fmt["name"]] = "/uploads/formats/" + output_name
            else:
                print("[FORMAT_ERROR] " + fmt["name"] + " | " + result.stderr[-300:])

        return results

    except Exception as e:
        print("[FORMATS_ERROR] " + str(e))
        return {}

def generate_scene_video_wan(visual_description, duration=5, brand_colors=None, aspect_ratio="9:16"):
    """يولّد فيديو باستخدام Wan (Alibaba DashScope) - تكلفة أقل بـ10x"""
    import os
    import time
    import uuid
    import requests
    from pathlib import Path
    import dashscope
    from dotenv import load_dotenv

    load_dotenv()

    api_key = os.getenv("DASHSCOPE_API_KEY")
    dashscope.api_key = api_key
    dashscope.base_http_api_url = "https://dashscope.aliyuncs.com/api/v1"

    colors_str = ""
    if brand_colors:
        colors_str = " Brand colors: " + ", ".join(brand_colors) + "."

    prompt = "Cinematic advertising video. " + str(visual_description) + colors_str

    if aspect_ratio == "9:16":
        size = "720*1280"
    elif aspect_ratio == "1:1":
        size = "1024*1024"
    elif aspect_ratio == "16:9":
        size = "1280*720"
    else:
        size = "720*1280"

    try:
        from dashscope import VideoSynthesis

        print("[WAN_GEN] Submitting task...")

        rsp = VideoSynthesis.async_call(
            model="wan2.2-t2v-plus",
            prompt=prompt,
            size=size,
        )

        if rsp.status_code != 200:
            print("[WAN_GEN_ERROR] Submit failed: " + str(rsp.status_code) + " | " + str(rsp.message))
            return None

        task_id = rsp.output.task_id
        print("[WAN_GEN] Task ID: " + str(task_id))

        for i in range(120):
            time.sleep(5)
            status_rsp = VideoSynthesis.fetch(task_id)
            status = status_rsp.output.task_status
            print("[WAN_GEN] Status: " + str(status))

            if status == "SUCCEEDED":
                video_url = status_rsp.output.video_url
                print("[WAN_GEN] Video URL obtained")

                filename = str(uuid.uuid4()) + ".mp4"
                folder = Path("uploads/videos")
                folder.mkdir(parents=True, exist_ok=True)
                local_path = folder / filename

                video_data = requests.get(video_url, timeout=300)
                with open(local_path, "wb") as f:
                    f.write(video_data.content)

                return "/uploads/videos/" + filename

            elif status == "FAILED":
                print("[WAN_GEN_ERROR] Task failed: " + str(status_rsp.output))
                return None

        print("[WAN_GEN_ERROR] Timeout")
        return None

    except Exception as e:
        print("[WAN_GEN_ERROR] " + str(e))
        return None

def generate_scene_video_agnes(visual_description, duration=5, brand_colors=None, aspect_ratio="9:16"):
    """يولّد فيديو عبر Magic Hour - 120 credits لكل 5 ثوانٍ (400 مجانًا)"""
    import os
    import time
    import uuid
    import requests
    from pathlib import Path
    from dotenv import load_dotenv

    load_dotenv()

    api_key = os.getenv("MAGICHOUR_API_KEY")
    if not api_key:
        print("[MH_GEN_ERROR] No API key")
        return None

    headers = {"Authorization": "Bearer " + api_key, "Content-Type": "application/json"}

    colors_str = ""
    if brand_colors:
        colors_str = " Brand colors: " + ", ".join(brand_colors) + "."

    prompt = "Cinematic advertising video. " + str(visual_description) + colors_str

    end_seconds = min(max(int(duration), 3), 5)

    payload = {
        "name": "Scene Video",
        "end_seconds": end_seconds,
        "model": "ltx-2.5",
        "resolution": "480p",
        "aspect_ratio": aspect_ratio,
        "style": {"prompt": prompt},
    }

    try:
        print("[MH_GEN] Submitting...")
        r = requests.post(
            "https://api.magichour.ai/v1/text-to-video",
            headers=headers,
            json=payload,
            timeout=60,
        )

        if r.status_code != 200:
            print("[MH_GEN_ERROR] Submit: " + str(r.status_code) + " | " + r.text[:300])
            return None

        data = r.json()
        job_id = data.get("id")
        print("[MH_GEN] Job ID: " + str(job_id) + " | Credits: " + str(data.get("credits_charged")))

        for i in range(60):
            time.sleep(5)
            check = requests.get(
                "https://api.magichour.ai/v1/video-projects/" + job_id,
                headers=headers,
                timeout=30,
            )
            job = check.json()
            status = job.get("status")
            print("[MH_GEN] Status: " + str(status))

            if status == "complete":
                video_url = (job.get("download") or {}).get("url")
                if not video_url:
                    print("[MH_GEN_ERROR] No URL")
                    return None

                filename = str(uuid.uuid4()) + ".mp4"
                folder = Path("uploads/videos")
                folder.mkdir(parents=True, exist_ok=True)
                local_path = folder / filename

                video_data = requests.get(video_url, timeout=300)
                with open(local_path, "wb") as f:
                    f.write(video_data.content)

                return "/uploads/videos/" + filename

            elif status == "error":
                print("[MH_GEN_ERROR] " + str(job))
                return None

        print("[MH_GEN_ERROR] Timeout")
        return None

    except Exception as e:
        print("[MH_GEN_ERROR] " + str(e))
        return None

def generate_scene_video_agnes(visual_description, duration=5, brand_colors=None, aspect_ratio="9:16"):
    """يولّد فيديو عبر Agnes AI (مجاني تمامًا - Unlimited)"""
    import os
    import time
    import uuid
    import requests
    from pathlib import Path
    from dotenv import load_dotenv

    load_dotenv()

    api_key = os.getenv("AGNES_API_KEY")
    if not api_key:
        print("[AGNES_ERROR] No API key")
        return None

    headers = {"Authorization": "Bearer " + api_key, "Content-Type": "application/json"}

    colors_str = ""
    if brand_colors:
        colors_str = " Brand colors: " + ", ".join(brand_colors) + "."

    prompt = "Cinematic advertising video. " + str(visual_description) + colors_str

    if aspect_ratio == "9:16":
        width, height = 720, 1280
    elif aspect_ratio == "16:9":
        width, height = 1280, 720
    elif aspect_ratio == "1:1":
        width, height = 1080, 1080
    else:
        width, height = 720, 1280

    try:
        print("[AGNES] Submitting...")
        r = requests.post(
            "https://apihub.agnes-ai.com/v1/videos",
            headers=headers,
            json={
                "model": "agnes-video-v2.0",
                "prompt": prompt,
                "height": height,
                "width": width,
                "num_frames": 121,
                "frame_rate": 24,
            },
            timeout=120,
        )

        if r.status_code == 429:
            print("[AGNES_ERROR] Rate limit. Waiting 60s...")
            time.sleep(60)
            return generate_scene_video_agnes(visual_description, duration, brand_colors, aspect_ratio)

        if r.status_code != 200:
            print("[AGNES_ERROR] Submit: " + str(r.status_code) + " | " + r.text[:300])
            return None

        data = r.json()
        video_id = data.get("video_id") or data.get("id")
        print("[AGNES] Video ID: " + str(video_id))

        for i in range(120):
            time.sleep(10)
            try:
                check = requests.get(
                    "https://apihub.agnes-ai.com/v1/videos/" + str(video_id),
                    headers=headers,
                    timeout=30,
                )
                job = check.json()
                status = job.get("status") or job.get("state")
                print("[AGNES] Status: " + str(status))

                if status in ["completed", "succeeded", "success", "done"]:
                    video_url = job.get("url") or job.get("video_url") or (job.get("output") or {}).get("url")
                    if not video_url:
                        print("[AGNES_ERROR] No URL in: " + str(job)[:300])
                        return None

                    filename = str(uuid.uuid4()) + ".mp4"
                    folder = Path("uploads/videos")
                    folder.mkdir(parents=True, exist_ok=True)
                    local_path = folder / filename

                    video_data = requests.get(video_url, timeout=300)
                    with open(local_path, "wb") as f:
                        f.write(video_data.content)

                    return "/uploads/videos/" + filename

                elif status in ["failed", "error"]:
                    print("[AGNES_ERROR] " + str(job)[:300])
                    return None

            except Exception as e:
                print("[AGNES_POLL_ERR] " + str(e)[:100])

        print("[AGNES_ERROR] Timeout")
        return None

    except Exception as e:
        print("[AGNES_ERROR] " + str(e))
        return None

def generate_scene_image_agnes(visual_description, brand_colors=None, aspect_ratio="9:16"):
    """يولّد صورة عبر Agnes AI (مجاني)"""
    import os
    import time
    import uuid
    import requests
    from pathlib import Path
    from dotenv import load_dotenv
    load_dotenv()

    api_key = os.getenv("AGNES_API_KEY")
    headers = {"Authorization": "Bearer " + api_key, "Content-Type": "application/json"}

    colors_str = ""
    if brand_colors:
        colors_str = " Brand colors: " + ", ".join(brand_colors) + "."

    prompt = "Professional advertising photograph. " + str(visual_description) + colors_str

    if aspect_ratio == "9:16":
        size = "768x1024"
    elif aspect_ratio == "16:9":
        size = "1024x768"
    else:
        size = "1024x1024"

    try:
        print("[AGNES_IMG] Submitting...")
        r = requests.post(
            "https://apihub.agnes-ai.com/v1/images/generations",
            headers=headers,
            json={
                "model": "agnes-image-2.1-flash",
                "prompt": prompt,
                "size": size,
            },
            timeout=120,
        )

        if r.status_code == 429:
            print("[AGNES_IMG] Rate limit, waiting 30s...")
            time.sleep(30)
            return generate_scene_image_agnes(visual_description, brand_colors, aspect_ratio)

        if r.status_code != 200:
            print("[AGNES_IMG_ERROR] " + str(r.status_code) + " | " + r.text[:300])
            return None

        data = r.json()
        
        # Try multiple response formats
        img_url = None
        if isinstance(data.get("data"), list) and len(data["data"]) > 0:
            img_url = data["data"][0].get("url")
        if not img_url:
            img_url = data.get("url") or (data.get("output") or {}).get("url")

        if not img_url:
            print("[AGNES_IMG_ERROR] No URL in: " + str(data)[:300])
            return None

        filename = str(uuid.uuid4()) + ".png"
        folder = Path("uploads/scenes")
        folder.mkdir(parents=True, exist_ok=True)
        local_path = folder / filename

        img_data = requests.get(img_url, timeout=120)
        with open(local_path, "wb") as f:
            f.write(img_data.content)

        return "/uploads/scenes/" + filename

    except Exception as e:
        print("[AGNES_IMG_ERROR] " + str(e))
        return None

