import os
import re
import httpx
import asyncio
from typing import Dict, Any, List

FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")

async def scrape_with_firecrawl(target_url: str) -> Dict[str, Any]:
    if not FIRECRAWL_API_KEY:
        print("[Firecrawl] Warning: FIRECRAWL_API_KEY not configured. Skipping Firecrawl scrape.")
        return {"ok": False, "error": "Firecrawl API key not set", "data": {}}

    headers = {
        "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
        "Content-Type": "application/json"
    }

    print(f"[Firecrawl] Starting scrape for: {target_url}")
    
    scrape_data = {}
    map_data = {"links": []}
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        # Phase 1: Scrape
        try:
            scrape_resp = await client.post(
                "https://api.firecrawl.dev/v1/scrape",
                headers=headers,
                json={
                    "url": target_url,
                    "formats": ["markdown", "html", "links"],
                    "onlyMainContent": False
                }
            )
            scrape_data = scrape_resp.json()
        except Exception as e:
            print(f"[Firecrawl] Scrape failed: {e}")
            return {"ok": False, "error": str(e), "data": {}}

        if scrape_resp.status_code != 200:
            print(f"[Firecrawl] Scrape error response: {scrape_data}")
            return {"ok": False, "error": scrape_data.get("error", "Unknown error"), "data": scrape_data}

        # Phase 2: Map (non-blocking)
        try:
            map_resp = await client.post(
                "https://api.firecrawl.dev/v1/map",
                headers=headers,
                json={"url": target_url, "limit": 200}
            )
            if map_resp.status_code == 200:
                map_data = map_resp.json()
        except Exception as e:
            print(f"[Firecrawl] Map failed, continuing with scrape data: {e}")

    # Process and combine results
    raw_data = scrape_data.get("data", scrape_data)
    html = raw_data.get("html", "")
    scrape_links = raw_data.get("links", [])
    map_links = map_data.get("links", [])
    
    # Deduplicate and sort links
    all_links = sorted(list(set(scrape_links + map_links)))
    metadata = raw_data.get("metadata", {})
    
    technologies = detect_technologies(html)
    
    js_files = [l for l in all_links if re.search(r'\.(js|mjs|jsx|ts|tsx)(\?|$)', l, re.IGNORECASE)]
    
    forms = extract_forms(html)
    
    external_deps = []
    try:
        from urllib.parse import urlparse
        target_host = urlparse(target_url).hostname or ""
        for l in all_links:
            try:
                l_host = urlparse(l).hostname
                if l_host and l_host != target_host:
                    external_deps.append(l)
            except:
                pass
    except:
        pass

    endpoints = [l for l in all_links if '?' in l or re.search(r'/(api|graphql|rest|v\d|admin|login|dashboard|wp-|config)', l, re.IGNORECASE)]
    
    security_headers = analyze_security_headers(metadata)

    parsed_data = {
        "urls": all_links[:500],
        "jsFiles": js_files,
        "externalDependencies": external_deps[:100],
        "forms": forms[:20],
        "endpoints": endpoints[:100],
        "metadata": metadata,
        "securityHeaders": security_headers
    }

    findings = generate_rule_based_findings(parsed_data, technologies, target_url)

    return {
        "ok": True,
        "raw_crawl_data": {
            "scrape": scrape_data,
            "map": map_data
        },
        "parsed_data": parsed_data,
        "technologies": technologies,
        "urls_found": len(all_links),
        "findings": findings
    }

def detect_technologies(html: str) -> List[str]:
    techs = []
    patterns = {
        'React': r'react\.production|reactDOM|__NEXT_DATA__|_next/',
        'Next.js': r'__NEXT_DATA__|_next/',
        'Vue.js': r'vue\.js|vue\.min\.js|__vue__',
        'Angular': r'ng-version|angular\.js|angular\.min\.js',
        'jQuery': r'jquery\.js|jquery\.min\.js|jquery/',
        'WordPress': r'wp-content|wp-includes|wordpress',
        'Bootstrap': r'bootstrap\.css|bootstrap\.min\.css|bootstrap\.js',
        'Tailwind CSS': r'tailwindcss|tailwind\.css',
        'Google Analytics': r'google-analytics|googletagmanager|gtag',
        'Google Tag Manager': r'googletagmanager\.com/gtm',
        'Cloudflare': r'cloudflare|cf-ray|__cf_bm',
        'Nginx': r'nginx',
        'PHP': r'\.php',
        'ASP.NET': r'asp\.net|__VIEWSTATE|__EVENTVALIDATION',
        'Shopify': r'shopify\.com|cdn\.shopify',
        'Wix': r'wix\.com|parastorage\.com',
        'Squarespace': r'squarespace\.com|sqsp\.net',
        'Drupal': r'drupal\.js|drupal\.settings',
        'HubSpot': r'hubspot\.com|hs-scripts',
        'Stripe': r'stripe\.com|stripe\.js',
    }
    
    for name, pattern in patterns.items():
        if re.search(pattern, html, re.IGNORECASE):
            techs.append(name)
            
    return techs

def extract_forms(html: str) -> List[Dict[str, Any]]:
    forms = []
    # Simplified regex for extracting forms and their inputs
    for form_match in re.finditer(r'<form([^>]*)>([\s\S]*?)</form>', html, re.IGNORECASE):
        form_attrs = form_match.group(1)
        form_body = form_match.group(2)
        
        action_match = re.search(r'action=["\']?([^"\'\s>]*)', form_attrs, re.IGNORECASE)
        method_match = re.search(r'method=["\']?([^"\'\s>]*)', form_attrs, re.IGNORECASE)
        
        action = action_match.group(1) if action_match else ""
        method = method_match.group(1).upper() if method_match else "GET"
        
        inputs = []
        for input_match in re.finditer(r'<input[^>]*name=["\']?([^"\'\s>]*)', form_body, re.IGNORECASE):
            inputs.append(input_match.group(1))
            
        forms.append({"action": action, "method": method, "inputs": inputs})
        
    return forms

def analyze_security_headers(metadata: dict) -> Dict[str, str]:
    # Keys in metadata are often lowercase or actual case depending on proxy
    def get_header(name: str) -> str:
        # Check standard casing
        if name in metadata: return metadata[name]
        # Check lower casing
        if name.lower() in metadata: return metadata[name.lower()]
        return "Not Set"

    return {
        'Content-Security-Policy': get_header('Content-Security-Policy'),
        'Strict-Transport-Security': get_header('Strict-Transport-Security'),
        'X-Frame-Options': get_header('X-Frame-Options'),
        'X-Content-Type-Options': get_header('X-Content-Type-Options'),
        'X-XSS-Protection': get_header('X-XSS-Protection'),
        'Referrer-Policy': get_header('Referrer-Policy'),
        'Permissions-Policy': get_header('Permissions-Policy'),
    }

def generate_rule_based_findings(parsed_data: dict, technologies: List[str], domain: str) -> List[Dict[str, Any]]:
    findings = []
    
    headers = parsed_data.get('securityHeaders', {})
    if headers.get('Content-Security-Policy') == 'Not Set':
        findings.append({
            'title': 'Missing Content-Security-Policy Header',
            'description': 'The website does not implement a Content-Security-Policy header, making it vulnerable to XSS and data injection attacks.',
            'severity': 'High',
            'category': 'Security Headers',
            'details': {'header': 'Content-Security-Policy', 'recommendation': 'Implement a strict CSP policy'}
        })
        
    if headers.get('Strict-Transport-Security') == 'Not Set':
        findings.append({
            'title': 'Missing HSTS Header',
            'description': 'HTTP Strict Transport Security is not enabled, allowing potential downgrade attacks.',
            'severity': 'Medium',
            'category': 'Security Headers',
            'details': {'header': 'Strict-Transport-Security'}
        })
        
    if headers.get('X-Frame-Options') == 'Not Set':
        findings.append({
            'title': 'Missing X-Frame-Options Header',
            'description': 'The site can be embedded in iframes, potentially enabling clickjacking attacks.',
            'severity': 'Medium',
            'category': 'Security Headers',
            'details': {'header': 'X-Frame-Options'}
        })
        
    sensitive_patterns = [
        (r'/(admin|wp-admin|administrator|panel|dashboard|cpanel)', 'Exposed Admin Panel', 'High'),
        (r'/(config|\.env|\.git|backup|dump|sql)', 'Sensitive Path Exposed', 'Critical'),
        (r'/(phpmyadmin|adminer|phpinfo)', 'Database Admin Tool Exposed', 'Critical'),
    ]
    
    for url in parsed_data.get('urls', []):
        for pattern, title, severity in sensitive_patterns:
            if re.search(pattern, url, re.IGNORECASE):
                findings.append({
                    'title': title,
                    'description': f'Potentially sensitive path detected: {url}',
                    'severity': severity,
                    'category': 'Exposed Paths',
                    'details': {'url': url}
                })
                break
                
    suspicious_params = ['id', 'redirect', 'url', 'file', 'path', 'page', 'cmd', 'exec', 'query', 'search', 'callback']
    from urllib.parse import urlparse, parse_qs
    for url in parsed_data.get('endpoints', []):
        try:
            parsed_u = urlparse(url)
            qs = parse_qs(parsed_u.query)
            for param in suspicious_params:
                if param in qs:
                    severity = 'High' if param in ['redirect', 'url'] else 'Medium'
                    findings.append({
                        'title': f'Suspicious Parameter: {param}',
                        'description': f'Query parameter "{param}" found at {url} — may be susceptible to injection or open redirect.',
                        'severity': severity,
                        'category': 'Injection Points',
                        'details': {'url': url, 'parameter': param}
                    })
        except:
            pass

    for form in parsed_data.get('forms', []):
        inputs_lower = [i.lower() for i in form.get('inputs', [])]
        if any(i in inputs_lower for i in ['search', 'query', 'q', 'keyword', 'comment', 'message']):
            findings.append({
                'title': 'Potential XSS Input Point',
                'description': f'Form with text input fields detected. May be vulnerable to XSS.',
                'severity': 'Medium',
                'category': 'XSS',
                'details': form
            })

    if 'jQuery' in technologies:
        findings.append({
            'title': 'jQuery Detected',
            'description': 'jQuery is present on the site. Older versions have known XSS vulnerabilities.',
            'severity': 'Low',
            'category': 'Outdated Libraries',
            'details': {'technology': 'jQuery'}
        })
        
    if 'WordPress' in technologies:
        findings.append({
            'title': 'WordPress CMS Detected',
            'description': 'WordPress installations require regular updates to prevent known exploits.',
            'severity': 'Medium',
            'category': 'CMS Risk',
            'details': {'technology': 'WordPress'}
        })

    return findings
