import requests

EMAIL = "abdelmoumeneahmed15@gmail.com"
PASSWORD = "12345678"

r = requests.post('http://localhost:8000/auth/login', json={'email': EMAIL, 'password': PASSWORD})
print("Login status:", r.status_code)

if r.status_code == 200:
    t = r.json()['token']
    h = {'Authorization': 'Bearer ' + t}
    campaigns = requests.get('http://localhost:8000/campaigns', headers=h).json()
    print("Campaigns:", len(campaigns))
    if campaigns:
        last = campaigns[0]
        print("Last ID:", last['id'])
        print("Status:", last['status'])
        detail = requests.get('http://localhost:8000/campaigns/' + last['id'], headers=h).json()
        scenes = detail.get('scenes') or []
        print("Scenes:", len(scenes))
        for s in scenes:
            print("  Scene", s.get('number'), "| video:", bool(s.get('video_url')), "| merged:", bool(s.get('merged_url')), "| voice:", bool(s.get('voice_url')))
else:
    print("Response:", r.text[:300])
