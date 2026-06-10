import shodan
import os

SHODAN_API_KEY = os.getenv("SHODAN_API_KEY")

def get_shodan_host(ip: str):
    if not SHODAN_API_KEY:
        return {"error": "SHODAN_API_KEY not configured"}
        
    try:
        api = shodan.Shodan(SHODAN_API_KEY)
        host = api.host(ip)
        return {
            "ip": host.get("ip_str"),
            "os": host.get("os", "Unknown"),
            "ports": host.get("ports", []),
            "hostnames": host.get("hostnames", []),
            "vulns": host.get("vulns", []),
            "data": host.get("data", [])
        }
    except shodan.APIError as e:
        return {"error": str(e)}
    except Exception as e:
        return {"error": str(e)}
