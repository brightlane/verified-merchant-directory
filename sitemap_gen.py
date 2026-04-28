import sqlite3

def generate_sitemaps(base_url="https://yourdomain.com"):
    conn = sqlite3.connect('vulture_inventory.db')
    cursor = conn.cursor()
    cursor.execute("SELECT slug FROM products")
    
    count = 0
    file_num = 1
    f = open(f'sitemap_{file_num}.xml', 'w')
    f.write('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

    for row in cursor:
        if count >= 45000: # Safety margin under 50k limit
            f.write('</urlset>')
            f.close()
            file_num += 1
            f = open(f'sitemap_{file_num}.xml', 'w')
            f.write('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
            count = 0
        
        f.write(f'<url><loc>{base_url}/p/{row[0]}</loc><changefreq>weekly</changefreq></url>')
        count += 1

    f.write('</urlset>')
    f.close()
    conn.close()
    print(f"✅ Generated {file_num} sitemap files.")

# generate_sitemaps()
