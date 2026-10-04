from pathlib import Path

file = Path("ai_service.py")
content = file.read_text(encoding="utf-8")

# إضافة طباعة للـresponse قبل parse
old = """    text = response.choices[0].message.content.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

    return json.loads(text).get("ideas", [])"""

new = """    text = response.choices[0].message.content.strip()
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
        return []"""

content = content.replace(old, new)
file.write_text(content, encoding="utf-8")
print("OK - Debug logging added")
