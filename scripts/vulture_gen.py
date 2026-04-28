import json
import os
from datetime import datetime

# --- CONFIGURATION ---
FEED_DIR = "data/feeds"
MERCHANT_DIR = "merchants"
INDEX_FILE = "index.html"
SITEMAP_FILE = "sitemap.xml"
BASE_URL = "https://brightlane.github.io/verified-merchant-directory/"

def generate_vulture_empire():
    print("🚀 VULTURE 10K ENGINE: INITIALIZING BUILD...")
    
    # 1. Prepare Directories
    if not os.path.exists(MERCHANT_DIR):
        os.makedirs(MERCHANT_DIR)

    generated_paths = []

    # 2. Process Feeds & Generate Atomic Product Pages
    if os.path.exists(FEED_DIR):
        feeds = [f for f in os.listdir(FEED_DIR) if f.endswith('.json')]
        for feed in feeds:
            m_id = feed.replace('.json', '')
            m_path = os.path.join(MERCHANT_DIR, m_id)
            if not os.path.exists(m_path):
                os.makedirs(m_path)
            
            with open(os.path.join(FEED_DIR, feed), 'r') as f:
                products = json.load(f)
                
            for item in products:
                p_name = item.get('name', 'Product')
                slug = p_name.lower().replace(" ", "-").replace("/", "-")[:50]
                file_name = f"{slug}.html"
                full_path = f"{m_id}/{file_name}"
                
                # Create the individual product page
                with open(os.path.join(m_path, file_name), "w", encoding="utf-8") as p:
                    p.write(f"<html><head><title>{p_name}</title></head><body><h1>{p_name}</h1><p>{item.get('description')}</p><a href='{item.get('buy_link')}'>View Deal</a></body></html>")
                
                generated_paths.append(f"merchants/{full_path}")

    # 3. Generate the "Final Boss" index.html
    index_html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Verified Merchant Directory | 2026 World Cup & Tax Hub</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            :root {{ --navy: #020617; --cyan: #22d3ee; }}
            body {{ background: var(--navy); color: #94a3b8; font-family: sans-serif; }}
            .lang-scroll {{ display: inline-block; animation: scroll 40s linear infinite; }}
            @keyframes scroll {{ from {{ transform: translateX(0); }} to {{ transform: translateX(-50%); }} }}
        </style>
    </head>
    <body>
        <div class="bg-slate-800 overflow-hidden py-2 border-b border-slate-700">
            <div class="lang-scroll whitespace-nowrap text-[10px] font-mono uppercase text-slate-400">
                EN US • ES ES • FR FR • DE DE • HI IN • ZH CN • JA JP • PT BR • RU RU • IT IT • KO KR • &nbsp;
                EN US • ES ES • FR FR • DE DE • HI IN • ZH CN • JA JP • PT BR • RU RU • IT IT • KO KR •
            </div>
        </div>
        <header class="max-w-6xl mx-auto pt-24 pb-16 px-6 text-center">
            <h1 class="text-6xl font-black text-white mb-6">Verified Merchant <span class="text-cyan-400">Network</span></h1>
            <p class="text-xl text-slate-400 mb-12">Global 2026 Partner Hub. {len(generated_paths)} Verified Links Active.</p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <a href="merchants/100273/" class="p-8 border border-slate-800 rounded-2xl bg-slate-900"><h3>IRS Tax Hub</h3></a>
                <a href="merchants/skyscanner/" class="p-8 border border-cyan-500/30 rounded-2xl bg-slate-900"><h3>World Cup Travel</h3></a>
                <a href="merchants/stadiumstay/" class="p-8 border border-slate-800 rounded-2xl bg-slate-900"><h3>StadiumStay</h3></a>
            </div>
        </header>
    </body>
    </html>
    """
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        f.write(index_html)

    # 4. Generate the sitemap.xml
    sitemap_content = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    sitemap_content += f'  <url><loc>{BASE_URL}</loc><priority>1.0</priority></url>\n'
    
    for path in generated_paths:
        sitemap_content += f'  <url><loc>{BASE_URL}{path}</loc><priority>0.7</priority></url>\n'
        
    sitemap_content += '</urlset>'
    
    with open(SITEMAP_FILE, "w", encoding="utf-8") as f:
        f.write(sitemap_content)

    print(f"✅ EMPIRE BUILT: {len(generated_paths)} Pages Indexed in Sitemap.")

if __name__ == "__main__":
    generate_vulture_empire()
