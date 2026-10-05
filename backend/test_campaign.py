import requests
import time

# 1. Login
r = requests.post('http://localhost:8000/auth/login', json={'email': 'natouahmed47@gmail.com', 'password': '12345678'})
token = r.json()['token']
headers = {'Authorization': 'Bearer ' + token}
print("[1] Logged in")

# 2. Get Brand
brands = requests.get('http://localhost:8000/brands', headers=headers).json()
brand_id = brands[0]['id']
print("[2] Brand:", brands[0]['name'])

# 3. Generate ideas
ideas = requests.post('http://localhost:8000/campaigns/ideas', headers=headers, json={'brand_id': brand_id}).json().get('ideas', [])
idea = ideas[0]
print("[3] Idea:", idea.get('title'))

# 4. Create Campaign
camp_resp = requests.post('http://localhost:8000/campaigns', headers=headers, json={'brand_id': brand_id, 'idea': idea})
camp = camp_resp.json()
campaign_id = camp['id']
print("[4] Campaign created:", campaign_id)
print("    Status:", camp['status'])
print()

# 5. Poll status
print("=" * 60)
print("MONITORING PIPELINE (10-15 min)")
print("=" * 60)

last_stage = ""
for i in range(60):
    time.sleep(30)
    status_resp = requests.get('http://localhost:8000/campaigns/' + campaign_id, headers=headers).json()
    status = status_resp.get('status')
    stage = status_resp.get('stage', '')
    
    if stage != last_stage:
        print("[" + str(i*30) + "s] Status: " + str(status) + " | " + str(stage))
        last_stage = stage
    
    if status == 'done':
        print()
        print("=" * 60)
        print("CAMPAIGN COMPLETE!")
        print("=" * 60)
        print("Final URL:", status_resp.get('final_url'))
        break
    elif status == 'failed':
        print()
        print("=" * 60)
        print("CAMPAIGN FAILED")
        print("=" * 60)
        print("Error:", status_resp.get('error'))
        break
