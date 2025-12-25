import requests
import time
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_flow():
    print("Starting Integration Flow...")
    
    # 1. Register User
    email = f"test_integration_{int(time.time())}@example.com"
    password = "StrongPassword123!"
    user_data = {
        "email": email,
        "password": password,
        "first_name": "Integration",
        "last_name": "Tester"
    }
    
    print(f"1. Registering user: {email}")
    resp = requests.post(f"{BASE_URL}/auth/register", json=user_data)
    if resp.status_code != 201:
        print(f"FAILED: Registration failed with {resp.status_code}: {resp.text}")
        sys.exit(1)
    
    data = resp.json()
    access_token = data["access_token"]
    print("   SUCCESS: Registration complete.")

    # 2. Login
    print("2. Logging in...")
    resp = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    if resp.status_code != 200:
        print(f"FAILED: Login failed with {resp.status_code}")
        sys.exit(1)
    print("   SUCCESS: Login complete.")
    
    # 3. Get Me
    print("3. Getting User Profile...")
    headers = {"Authorization": f"Bearer {access_token}"}
    resp = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    if resp.status_code != 200:
        print(f"FAILED: Get Me failed with {resp.status_code}")
        sys.exit(1)
    print(f"   SUCCESS: Hello {resp.json()['first_name']}")

    # 4. Rate Limit Test (Smoke)
    # Just sending a few requests to make sure we don't crash
    print("4. Sending multiple requests (Smoke test for stability)...")
    for i in range(5):
        resp = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        if resp.status_code != 200:
             print(f"FAILED: Request {i} failed")
             sys.exit(1)
    print("   SUCCESS: Stability check passed.")

    print("\nALL INTEGRATION CHECKS PASSED!")

if __name__ == "__main__":
    test_flow()
