@app.route('/p/<slug>')
def product_page(slug):
    conn = get_db_connection()
    product = conn.execute('SELECT * FROM products WHERE slug = ?', (slug,)).fetchone()
    conn.close()

    if product:
        # DYNAMIC LINK GENERATION
        aff_link = generate_affiliate_link(product['merchant_key'], product['product_url'])
        
        return render_template('vulture_live.html', 
                               product=product, 
                               aff_link=aff_link,
                               merchant_name=product['merchant_key'].replace('_', ' ').title())
    return "Product Not Found", 404
