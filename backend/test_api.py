import requests
import json

BASE_URL = "http://localhost:8000"

def test_api():
    print("Testing Root...")
    try:
        r = requests.get(f"{BASE_URL}/")
        print(f"Status: {r.status_code}, Response: {r.json()}")
    except Exception as e:
        print(f"Failed: {e}")
        return

    print("\nTesting Categorization...")
    cat_payload = {"merchant": "Starbucks"}
    r = requests.post(f"{BASE_URL}/categorize", json=cat_payload)
    print(f"Response: {r.json()}")

    print("\nTesting Anomaly...")
    # Normal transaction
    anom_payload = {
        "amount": 5.00,
        "category": "Food & Drink",
        "date": "2023-05-15"
    }
    r = requests.post(f"{BASE_URL}/analyze/anomaly", json=anom_payload)
    print(f"Normal Check: {r.json()}")
    
    # Weird transaction
    anom_payload['amount'] = 5000.00
    r = requests.post(f"{BASE_URL}/analyze/anomaly", json=anom_payload)
    print(f"Anomaly Check: {r.json()}")

if __name__ == "__main__":
    test_api()
