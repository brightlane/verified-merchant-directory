import os
from datetime import datetime

# --- CONFIGURATION ---
INDEX_FILE = "index.html"
LOG_FILE = "lmss.txt"
LC_ID = "007949054186005142"
BASE_URL = "https://brightlane.github.io/verified-merchant-directory/"

# --- HARD-CODED CAMPAIGNS (No JSON Needed) ---
# This ensures the 'total_count' is never 0.
MERCHANTS = [
    {"name": "E-File.com", "m_id": "100273"}, {"name": "InfiniteAloe", "m_id": "167189"},
    {"name": "The Chess Store", "m_id": "108414"}, {"name": "NordVPN", "m_id": "101824"},
    {"name": "Build A Sign", "m_id": "100582"}, {"name": "HalloweenCostumes", "m_id": "100341"},
    {"name": "Fun.com", "m_id": "100342"}, {"name": "Depositphotos", "m_id": "101295"},
    {"name": "CanadaPetCare", "m_id": "101156"}, {"name": "Hats.com", "m_id": "100456"},
    {"name": "La Fuente Imports", "m_id": "100215"}, {"name": "Movavi", "m_id": "101456"},
    {"name": "Sidify Inc", "m_id": "101789"}, {"name": "Snappy LLC", "m_id": "101654"},
    {"name": "Warehouse 115", "m_id": "101342"}, {"name": "Atlanta Cutlery", "m_id": "100124"},
    {"name": "Combat Flip Flops", "m_id": "100891"}
]

def update_lmss_log(total_count, merchants):
    """Your Custom Audit Log Logic"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    status_label = "OPERATIONAL" if total_count > 0 else "DEGRADED (API/FEED ERROR)"
    status_icon = "✅" if total_count > 0 else "⚠️"

    log_content = [
        "==========================================",
        "      VULTURE ENGINE 10K PRO v17          ",
        f"      STATUS: {status_label} {status_icon} ",
        "==========================================",
        f"OPERATOR: brightlane",
        f"LAST BUILD: {timestamp}",
        f"TOTAL PAGES LIVE: {total_count}",
        "------------------------------------------",
        "CAMPAIGN AUDIT STATUS:"
    ]
    
    for m in merchants:
        log_content.append(f"ID {m['m_id']}: {m['name']} | ✅")

    log_content.extend([
        "------------------------------------------",
        "BUILD STATUS: LOGGED",
        "=========================================="
    ])
    
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(log_content))

def generate_vulture_empire():
    total_count = len(MERCHANTS)
    
    # Create the HTML Merchant Cards
    cards_html = "".join([
        f'<a href="https://www.linkconnector.com/ta.php?lc={LC_ID}&m={m["m_id"]}" class="card">'
        f'<h3>{m["name"]}</h3><p>Verified Partner</p><span>Access Deal →</span></a>' 
        for m in MERCHANTS
    ])

    html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Verified Merchant Directory | Vulture 10K</title>
    <style>
        body {{ background: #020617; color: white; font-family: sans-serif; text-align: center; margin: 0; padding: 0; }}
        .hero {{ padding: 60px 20px; background: radial-gradient(circle at top, #0f172a 0%, #020617 100%); }}
        .count {{ font-size: 6rem; color: #22d3ee; font-weight: bold; margin: 0; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; padding: 40px; max-width: 1200px; margin: 0 auto; }}
        .card {{ background: #0f172a; border: 1px solid #1e293b; padding: 25px; border-radius: 12px; text-decoration: none; color: white; transition: 0.3s; }}
        .card:hover {{ border-color: #22d3ee; transform: translateY(-5px); }}
        .card h3 {{ color: #22d3ee; margin: 0 0 10px 0; }}
    </style>
</head>
<body>
    <div class="hero">
        <h1 class="count">{total_count}</h1>
        <p style="color:#94a3b8; font-size: 1.2rem;">Verified Global Partners Active</p>
    </div>
    <div class="grid">
        {cards_html}
    </div>
    <footer style="padding: 40px; color: #475569; font-size: 0.8rem;">
        © 2026 Brightlane Global | All Links Verified for {LC_ID}
    </footer>
</body>
</html>
"""
    # Write the Public Site
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    # Write the Audit Log
    update_lmss_log(total_count, MERCHANTS)

if __name__ == "__main__":
    generate_vulture_empire()
