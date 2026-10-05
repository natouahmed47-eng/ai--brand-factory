import requests
import json

# 1. Login
r = requests.post('http://localhost:8000/auth/login', json={'email': 'natouahmed47@gmail.com', 'password': '12345678'})
token = r.json()['token']
headers = {'Authorization': 'Bearer ' + token}

# 2. Get Brand
brands = requests.get('http://localhost:8000/brands', headers=headers).json()
brand_id = brands[0]['id']
print("Using Brand:", brands[0]['name'], "|", brand_id)

# 3. Get Brand Brain
brand = requests.get('http://localhost:8000/brands/' + brand_id, headers=headers).json()

# 4. Generate ideas
ideas_resp = requests.post('http://localhost:8000/campaigns/ideas', headers=headers, json={'brand_id': brand_id})
ideas = ideas_resp.json().get('ideas', [])
idea = ideas[0]
print("Using idea:", idea.get('title'))

# 5. Run pipeline
from ai_service import full_production_pipeline

print("\n" + "="*60)
print("STARTING FULL PRODUCTION PIPELINE")
print("="*60 + "\n")

result = full_production_pipeline(brand, idea)

print("\n" + "="*60)
print("PIPELINE COMPLETE")
print("="*60)
print("Final URL:", result.get('final_url'))
print("Errors:", result.get('errors'))
print("Scenes:", len(result.get('scenes', [])))
