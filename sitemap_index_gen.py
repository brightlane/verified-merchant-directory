import os

def generate_master_sitemap_index(domain="https://brightlane.github.io/verified-merchant-directory"):
    # Ensure we are looking in the correct directory relative to the repo root
    sitemap_dir = 'sitemaps'
    
    # Create directory if it doesn't exist to prevent script failure
    if not os.path.exists(sitemap_dir):
        os.makedirs(sitemap_dir)
        print(f"📁 Created missing directory: {sitemap_dir}")

    sitemap_files = [f for f in os.listdir(sitemap_dir) if f.startswith('sitemap_') and f.endswith('.xml')]
    
    if not sitemap_files:
        print("⚠️ No sub-sitemaps found! Run sitemap_gen.py first.")
        return

    with open('sitemap_index.xml', 'w') as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        f.write('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        
        for sfile in sitemap_files:
            # GitHub Pages URLs are case-sensitive and require the full path
            f.write(f'  <sitemap>\n')
            f.write(f'    <loc>{domain}/sitemaps/{sfile}</loc>\n')
            f.write(f'  </sitemap>\n')
            
        f.write('</sitemapindex>')
    print(f"✅ Master Index generated at root for {len(sitemap_files)} files.")

if __name__ == "__main__":
    generate_master_sitemap_index()
