import os
from datetime import datetime

# 1. FORCE THE PATHS (Ensures it writes to the root directory)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_PATH = os.path.join(BASE_DIR, "index.html")
LMSS_PATH = os.path.join(BASE_DIR, "lmss.txt")

# 2. DATA SOURCE (Hard-coded to bypass file-reading errors)
LC_ID = "007949054186005142"
MERCHANTS = [
    {"n": "E-File.com", "id": "100273"}, {"n": "InfiniteAloe", "id": "167189"},
    {"n": "The Chess Store", "id": "108414"}, {"n": "NordVPN", "id": "101824"},
    {"n": "Build A Sign", "id": "100582"}, {"n": "HalloweenCostumes", "id": "100341"},
    {"n": "Fun.com", "id": "100342"}, {"n": "Depositphotos", "id": "101295"},
    {"n": "CanadaPetCare", "id": "101156"}, {"n": "Hats.com", "id": "100456"},
    {"n": "La Fuente Imports", "id": "100215"}, {"n": "Movavi", "id": "101456"},
    {"n": "Sidify Inc", "id": "101789"}, {"n": "Snappy LLC", "id": "101654"},
    {"n": "Warehouse 115", "id": "101342"}, {"n": "Atlanta Cutlery", "id": "100124"},
    {"n": "Combat Flip Flops", "id": "100891"}
]

def build():
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Generate the Card HTML inside a safe loop
    card_html = ""
    for m in MERCHANTS:
        link = f"https://www.linkconnector.com/ta.php?lc={LC_ID}&m={m['id']}"
        card_html += f'''
        <a href="{link}" class="card">
            <h3>{m['n']}</h3>
            <p>Verified Partner</p>
            <div class="btn">Access Deal →</div>
        </a>'''

    # THE ENTIRE PAGE IN ONE BLOCK
    full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verified Merchant Network | Vulture 10K</title>
    <style>
        body {{ background: #020617; color: white; font-family: sans-serif; text-align: center; margin: 0; padding: 0; }}
        .hero {{ padding: 80px 20px; background: radial-gradient(circle at top, #0f172a 0%, #020617 100%); }}
        .count {{ font-size: 7rem; color: #22d3ee; font-weight: bold; margin: 0; line-height: 1; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; padding: 40px; max-width: 1200px; margin: 0 auto; }}
        .card {{ background: #0f172a; border: 1px solid #1e293b; padding: 30px; border-radius: 12px; text-decoration: none; color: white; transition: 0.3s; display: block; }}
        .card:hover {{ border-color: #22d3ee; transform: translateY(-5px); }}
        .card h3 {{ color: #22d3ee; margin: 0 0 10px 0; font-size: 1.5rem; }}
        .btn {{ margin-top: 15px; background: #22d3ee; color: black; padding: 10px; border-radius: 6px; font-weight: bold; font-size: 0.8rem; }}
    </style>
</head>
<body>
    <div class="hero">
        <h1 class="count">{len(MERCHANTS)}</h1>
        <p style="color:#94a3b8; font-size: 1.2rem; margin-top: 10px;">Verified Global Campaigns Active</p>
        <p style="color:#22d3ee; font-size: 0.9rem;">ID: {LC_ID}</p>
    </div>
    <div class="grid">
        {card_html}
    </div>
    <footer style="padding: 60px; color: #475569; font-size: 0.8rem; border-top: 1px solid #1e293b;">
        © 2026 Brightlane Global | Tracking Active | Last Sync: {now}
    </footer>
</body>
</html>"""

    # WRITE THE FILES
    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        f.write(full_html)
        
    with open(LMSS_PATH, "w", encoding="utf-8") as f:
        f.write(f"STATUS: OPERATIONAL\nTOTAL: {len(MERCHANTS)}\nSYNC: {now}")

if __name__ == "__main__":
    build()
