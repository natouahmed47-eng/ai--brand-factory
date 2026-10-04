import requests

login = requests.post(
    "http://localhost:8000/auth/login",
    json={"email": "natouahmed47@gmail.com", "password": "12345678"},
)
token = login.json()["token"]
print("Login OK")

headers = {"Authorization": "Bearer " + token}
brands = requests.get("http://localhost:8000/brands", headers=headers).json()
brand_id = brands[0]["id"]
print("Brand:", brands[0]["name"])

response = requests.post(
    "http://localhost:8000/campaigns/ideas",
    headers=headers,
    json={"brand_id": brand_id},
)
ideas = response.json().get("ideas", [])
print("Ideas count:", len(ideas))
for i, idea in enumerate(ideas, 1):
    print(str(i) + ". " + idea.get("title", ""))
