import sqlite3

def generate_sitemaps(domain="https://yourlinkdomain.com"):
    conn = sqlite3.connect('vulture_inventory.db')
    cursor = conn.cursor()
    cursor.execute("SELECT slug FROM products")
    
    count = 0
    file_num = 1
    f = open(f'sitemaps/sitemap_{file_num}.xml', 'w')
    f.write('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

    for row in cursor:
        if count >= 48000: # Split before the 50k hard limit
            f.write('</urlset>')
            f.close()
            file_num += 1
            f = open(f'sitemaps/sitemap_{file_num}.xml', 'w')
            f.write('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
            count = 0
        
        f.write(f'<url><loc>{domain}/p/{row[0]}</loc></url>')
        count += 1

    f.write('</urlset>')
    f.close()
    conn.close()
    print(f"📁 Created {file_num} sitemap files for indexing.")

# generate_sitemaps()
