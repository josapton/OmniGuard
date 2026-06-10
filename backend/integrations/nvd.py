import httpx
import os
import time

NVD_API_KEY = os.getenv("NVD_API_KEY")

# Simple in-memory cache to prevent NVD API bottleneck
# Format: { "cpe_name": {"timestamp": float, "data": list} }
_NVD_CACHE = {}
CACHE_TTL = 3600  # Cache duration: 1 hour (3600 seconds)

async def get_cve_data(cpe_name: str):
    # 1. Check if valid cache exists
    now = time.time()
    if cpe_name in _NVD_CACHE:
        cached = _NVD_CACHE[cpe_name]
        if now - cached["timestamp"] < CACHE_TTL:
            print(f"[NVD Cache Hit] Returning cached data for {cpe_name}")
            return cached["data"]

    # 2. If no cache or expired, fetch from API
    headers = {}
    if NVD_API_KEY:
        headers["apiKey"] = NVD_API_KEY

    url = f"https://services.nvd.nist.gov/rest/json/cves/2.0?cpeName={cpe_name}"
    
    try:
        print(f"[NVD Cache Miss] Fetching from API for {cpe_name}")
        async with httpx.AsyncClient() as client:
            # Increased timeout to 25s for slow NVD responses
            response = await client.get(url, headers=headers, timeout=25.0)
            response.raise_for_status()
            data = response.json()
            results = data.get("vulnerabilities", [])
            
            # 3. Save result to cache
            _NVD_CACHE[cpe_name] = {
                "timestamp": now,
                "data": results
            }
            return results
    except Exception as e:
        print(f"Error fetching from NVD API: {e}")
        # If API fails but we have stale cache, we could return it, but here we return empty array
        return []
