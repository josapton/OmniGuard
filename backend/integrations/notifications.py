import os
import httpx

# Tries to get the webhook from environment variables
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")

async def send_discord_alert(domain: str, scan_id: str, risk_score: int, critical_count: int, high_count: int):
    """
    Sends an alert to Discord if vulnerabilities are found.
    """
    if not DISCORD_WEBHOOK_URL:
        print("[Notification] Discord Webhook URL is not set. Skipping alert.")
        return

    # Determine color based on risk score
    color = 0x3b82f6 # blue
    if risk_score >= 75:
        color = 0xef4444 # red
    elif risk_score >= 50:
        color = 0xf97316 # orange
    elif risk_score >= 25:
        color = 0xeab308 # yellow

    payload = {
        "username": "OmniGuard Alert",
        "avatar_url": "https://i.imgur.com/4M34hi2.png", # Optional placeholder logo
        "embeds": [
            {
                "title": f"🚨 OmniGuard Security Alert: {domain}",
                "description": "Continuous monitoring has detected high-risk vulnerabilities on your asset.",
                "color": color,
                "fields": [
                    {"name": "Domain", "value": f"`{domain}`", "inline": True},
                    {"name": "Risk Score", "value": f"**{risk_score}/100**", "inline": True},
                    {"name": "Scan ID", "value": f"`{scan_id}`", "inline": False},
                    {"name": "Critical Findings", "value": str(critical_count), "inline": True},
                    {"name": "High Findings", "value": str(high_count), "inline": True}
                ],
                "footer": {"text": "OmniGuard Continuous Monitoring"}
            }
        ]
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(DISCORD_WEBHOOK_URL, json=payload, timeout=10.0)
            response.raise_for_status()
            print(f"[Notification] Discord alert sent successfully for {domain}.")
    except Exception as e:
        print(f"[Notification] Failed to send Discord alert: {e}")
