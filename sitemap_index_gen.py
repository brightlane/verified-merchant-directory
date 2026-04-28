import os

def generate_master_sitemap_index(domain="https://yourlinkdomain.com"):
    sitemap_files = [f for f in os.listdir('sitemaps') if f.startswith('sitemap_') and f.endswith('.xml')]
    
    with open('sitemap_index.xml', 'w') as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        f.write('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        
        for sfile in sitemap_files:
            f.write(f'  <sitemap>\n')
            f.write(f'    <loc>{domain}/sitemaps/{sfile}</loc>\n')
            f.write(f'  </sitemap>\n')
            
        f.write('</sitemapindex>')
    print(f"✅ Master Index generated for {len(sitemap_files)} sitemaps.")

# Run this after sitemap_gen.py
# generate_master_sitemap_index()
