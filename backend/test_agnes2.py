import os
import requests
from dotenv import load_dotenv
load_dotenv()

api_key = os.getenv("AGNES_API_KEY")
headers = {"Authorization": "Bearer " + api_key, "Content-Type": "application/json"}

print("=" * 60)
print("TEST A: /v1/videos/generations (without duration)")
print("=" * 60)

r = requests.post(
    "https://apihub.agnes-ai.com/v1/videos/generations",
    headers=headers,
    json={
        "model": "agnes-video-2.5-flash",
        "prompt": "A luxurious perfume bottle on a marble table with golden light, cinematic"
    },
    timeout=60,
)
print("Status:", r.status_code)
print("Response:", r.text[:800])
print()

print("=" * 60)
print("TEST B: /v1/videos/generations (with seconds)")
print("=" * 60)

r2 = requests.post(
    "https://apihub.agnes-ai.com/v1/videos/generations",
    headers=headers,
    json={
        "model": "agnes-video-2.5-flash",
        "prompt": "A luxurious perfume bottle on marble table",
        "seconds": 5,
        "size": "720x1280"
    },
    timeout=60,
)
print("Status:", r2.status_code)
print("Response:", r2.text[:800])
