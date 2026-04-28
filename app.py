from flask import Flask, render_template, abort, redirect
import sqlite3
import urllib.parse
import json

app = Flask(__name__)

# Load your 17 approved merchants
with open('approved_merchants.json', 'r') as f:
    CONFIG = json.load(f)

def get_db_connection():
    conn = sqlite3.connect('vulture_inventory.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/p/<slug>')
def product_page(slug):
    conn = get_db_connection()
    product = conn.execute('SELECT * FROM products WHERE slug = ?', (slug,)).fetchone()
    conn.close()

    if product is None:
        abort(404)

    # SECURE LINK GENERATION LOGIC
    merchant = CONFIG['merchants'].get(product['merchant_key'])
    aff_id = CONFIG['affiliate_id'] # 014538
    
    # URL Encode the destination merchant link
    target_url = urllib.parse.quote(product['product_url'], safe='')
    
    # Final LinkConnector Tracking URL
    final_aff_link = f"https://www.linkconnector.com/ta.php?lc={aff_id}{merchant['lc_id']}&url={target_url}"

    # In a real setup, you'd return render_template('product.html', product=product, link=final_aff_link)
    # For now, here is the raw output structure:
    return {
        "title": product['title'],
        "price": f"${product['price']}",
        "merchant": product['merchant_key'],
        "affiliate_button_url": final_aff_link,
        "image": product['image_url']
    }

if __name__ == '__main__':
    app.run(debug=True, port=5000)
