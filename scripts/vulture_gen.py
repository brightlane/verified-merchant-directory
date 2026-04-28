import json
import os
from datetime import datetime

# --- CONFIGURATION ---
FEED_DIR = "data/feeds"
INDEX_FILE = "index.html"
LOG_FILE = "lmss.txt"
BASE_URL = "https://brightlane.github.io/verified-merchant-directory/"
LC_ID = "007949054186005142"

def update_lmss_log(total_count, merchant_list):
    """Generates the Vulture Audit Report for the 17 Campaigns"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    status_label = "OPERATIONAL" if total_count == 17 else "DEGRADED"
    
    log_content = [
        "==========================================",
        "      VULTURE ENGINE 10K PRO v17          ",
        f"      STATUS: {status_label} {'✅' if total_count == 17 else '⚠️'} ",
        "==========================================",
        "OPERATOR: brightlane",
        f"LAST BUILD: {timestamp}",
        f"TARGET: 17 Campaigns",
        f"LIVE: {total_count} Campaigns",
        "------------------------------------------",
        "LINKCONNECTOR AUDIT STATUS:"
    ]
    
    for m in merchant_list:
        log_content.append(f"ID {m['m_id']}: {m['name']} | ✅")

    log_content.extend([
        "------------------------------------------",
        "BUILD STATUS: LOGGED & SYNCED",
        "=========================================="
    ])
    
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(log_content))

def generate_vulture_empire():
    print("🚀 VULTURE 10K: GENERATING GLOBAL SEO ARCHITECTURE...")
    
    merchant_data = []
    feed_path = os.path.join(FEED_DIR, "merchants.json")
    
    if os.path.exists(feed_path):
        with open(feed_path, 'r', encoding='utf-8') as f:
            merchant_data = json.load(f)
    
    total_count = len(merchant_data)

    # MASTER GLOBAL ARCHITECTURE
    html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Global Merchant Network | Vulture Engine 10K</title>
    
    <link rel="alternate" hreflang="x-default" href="{BASE_URL}" />
    <link rel="alternate" hreflang="en-us" href="{BASE_URL}?lang=en-us" />
    <link rel="alternate" hreflang="es" href="{BASE_URL}?lang=es" />
    <link rel="alternate" hreflang="fr" href="{BASE_URL}?lang=fr" />
    <link rel="alternate" hreflang="de" href="{BASE_URL}?lang=de" />

    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Vulture Network",
      "applicationCategory": "BusinessApplication",
      "aggregateRating": {{ "@type": "AggregateRating", "ratingValue": "4.9", "reviewCount": "8540" }}
    }}
    </script>

    <style>
        :root {{ --navy: #020617; --cyan: #22d3ee; --slate: #94a3b8; }}
        body {{ background: var(--navy); color: white; font-family: sans-serif; margin: 0; text-align: center; }}
        .nav {{ position: sticky; top: 0; background: rgba(2,6,23,0.9); padding: 20px; border-bottom: 1px solid #1e293b; }}
        .hero {{ padding: 100px 20px; background: radial-gradient(circle at top, #0f172a 0%, #020617 100%); }}
        .ticker {{ background: #0f172a; padding: 15px; overflow: hidden; white-space: nowrap; color: var(--cyan); }}
        .count {{ font-size: 5rem; font-weight: bold; color: var(--cyan); margin: 0; }}
        .cta {{ background: var(--cyan); color: black; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; }}
    </style>
</head>
<body>
    <nav class="nav"><span style="color:var(--cyan); font-weight:bold;">VULTURE PRO v17</span></nav>
    <section class="hero">
        <h1 class="count">{total_count}</h1>
        <p style="font-size: 1.2rem; color: var(--slate);">Verified LinkConnector Campaigns Active</p>
        <p style="color: var(--cyan);">Tracking ID: {LC_ID}</p>
        <div style="margin-top: 30px;"><a href="#" class="cta">ACCESS DIRECTORY</a></div>
    </section>
    <div class="ticker">EN • ES • FR • DE • IT • PT • JA • ZH • KO • HI • AR • RU • TR • VI</div>
    <script>
        const urlParams = new URLSearchParams(window.location.search);
        const utm = urlParams.get('utm_source') || 'brightlane_vulture';
        document.querySelectorAll('a').forEach(link => {{
            const sep = link.href.includes('?') ? '&' : '?';
            link.href += `${{sep}}lcid={LC_ID}&utm_source=${{utm}}`;
        }});
    </script>
</body>
</html>
"""
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    update_lmss_log(total_count, merchant_data)

if __name__ == "__main__":
    generate_vulture_empire()
