from flask import render_template
import sqlite3

def get_categories_by_merchant(merchant_key):
    conn = sqlite3.connect('vulture_inventory.db')
    conn.row_factory = sqlite3.Row
    # Get unique categories for a merchant and count items
    categories = conn.execute('''
        SELECT category, COUNT(*) as item_count 
        FROM products 
        WHERE merchant_key = ? 
        GROUP BY category 
        ORDER BY item_count DESC
    ''', (merchant_key,)).fetchall()
    conn.close()
    return categories

# Add this route to your main app.py
@app.route('/c/<merchant_key>/<category_slug>')
def category_page(merchant_key, category_slug):
    conn = get_db_connection()
    # Fetch top 50 products for this category to keep the page fast
    products = conn.execute('''
        SELECT * FROM products 
        WHERE merchant_key = ? AND category LIKE ?
        LIMIT 50
    ''', (merchant_key, f'%{category_slug}%')).fetchall()
    conn.close()
    
    return render_template('category_view.html', products=products, merchant=merchant_key, category=category_slug)
