import requests
import time
import sys

BASE_URL = "http://127.0.0.1:8000"

endpoints_to_test = [
    {
        "name": "Chat Endpoint",
        "method": "POST",
        "url": f"{BASE_URL}/api/chat/",
        "json": {"query": "What is SQL injection?", "context": ""}
    },
    {
        "name": "Modeling Endpoint",
        "method": "POST",
        "url": f"{BASE_URL}/api/modeling/predict",
        "json": {"asset_name": "Web Server", "cpe_name": "cpe:2.3:a:apache:http_server:2.4.49", "environment": "production"}
    },
    {
        "name": "OSINT Endpoint",
        "method": "POST",
        "url": f"{BASE_URL}/api/osint/analyze",
        "json": {"raw_text": "Hackers leaked data from example.com on pastebin. IP: 192.168.1.1"}
    },
    {
        "name": "Remediation Endpoint",
        "method": "POST",
        "url": f"{BASE_URL}/api/remediation/generate",
        "json": {"vulnerability_details": "CVE-2021-41773 Path Traversal", "target_os": "linux"}
    },
    {
        "name": "Search Endpoint (Query)",
        "method": "POST",
        "url": f"{BASE_URL}/api/search/",
        "json": {"query": "vulnerability"}
    },
    {
        "name": "Exposure Analysis",
        "method": "POST",
        "url": f"{BASE_URL}/api/exposure/simulate",
        "json": {
            "target_ip": "192.168.1.100",
            "open_ports": ["80", "443"],
            "running_services": ["nginx", "ssh"],
            "known_vulnerabilities": ["CVE-2021-34527"]
        }
    }
]

def run_tests():
    print(f"Starting API Tests against {BASE_URL}...")
    all_passed = True
    
    for ep in endpoints_to_test:
        print(f"\nTesting {ep['name']}...")
        try:
            if ep["method"] == "POST":
                resp = requests.post(ep["url"], json=ep.get("json", {}), timeout=30)
            elif ep["method"] == "GET":
                resp = requests.get(ep["url"], timeout=30)
                
            print(f"Status Code: {resp.status_code}")
            if resp.status_code == 200:
                print(f"Success! Response: {str(resp.json())[:100]}...")
            else:
                print(f"FAILED! Response: {resp.text}")
                all_passed = False
                
        except Exception as e:
            print(f"FAILED with exception: {str(e)}")
            all_passed = False
            
    if all_passed:
        print("\nAll endpoints responded with 200 OK!")
        sys.exit(0)
    else:
        print("\nSome endpoints failed!")
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
