from pathlib import Path

p = Path("ai_service.py")
c = p.read_text(encoding="utf-8")

# Fix audio in merge_scene
old1 = '''            "-c:v", "copy",
            "-c:a", "aac",
            "-shortest",
            "-map", "0:v:0",
            "-map", "1:a:0",
            str(output_path),'''

new1 = '''            "-c:v", "copy",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
            "-shortest",
            "-map", "0:v:0",
            "-map", "1:a:0",
            str(output_path),'''

if old1 in c:
    c = c.replace(old1, new1)
    print("OK - Audio quality fixed in merge_scene")

# Fix audio in merge_with_music
old2 = '''            "-map", "0:v:0",
            "-map", "[aout]",
            "-c:v", "copy",
            "-c:a", "aac",
            "-shortest",'''

new2 = '''            "-map", "0:v:0",
            "-map", "[aout]",
            "-c:v", "copy",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
            "-shortest",'''

if old2 in c:
    c = c.replace(old2, new2)
    print("OK - Audio quality fixed in merge_with_music")

# Fix audio in add_music_to_video
old3 = '''            "-map", "0:v:0",
            "-map", "[aout]",
            "-c:v", "copy",
            "-c:a", "aac",
            "-shortest",
            str(output_path),'''

new3 = '''            "-map", "0:v:0",
            "-map", "[aout]",
            "-c:v", "copy",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
            "-shortest",
            str(output_path),'''

if old3 in c:
    c = c.replace(old3, new3)
    print("OK - Audio quality fixed in add_music_to_video")

p.write_text(c, encoding="utf-8")
print("DONE - All audio improved to 192k stereo")
