def get_seo_metadata(product):
    m_key = product['merchant_key']
    title = product['title']
    price = f"${product['price']}"

    # Niche-specific patterns for your 17 approved merchants
    patterns = {
        "abebooks": f"Buy {title} | Rare & Used Books at AbeBooks",
        "lyst": f"{title} Sale | Best Prices on Designer Fashion at Lyst",
        "halloweencostumes": f"{title} | Fast Shipping & Best Price for 2026",
        "tenorshare": f"Download {title} | Official 10% Off Coupon Applied",
        "wondershare": f"{title} Software | Official Discount & Free Trial",
        "wolters_kluwer": f"{title} | Medical Journals & Textbooks - Shop LWW",
        "chess_store": f"{title} | Premium Chess Sets & Equipment",
        "viper_tec": f"{title} | High-Performance Tactical Gear",
        "ticketbuyback": f"Sell Your {title} Tickets | Safe & Instant Payout",
        "build_a_sign": f"Custom {title} | Design Online & Save Today"
    }

    # Default pattern for the remaining approved merchants
    default_meta = f"Get {title} for {price} | Official Affiliate Deal"
    
    return patterns.get(m_key, default_meta)
