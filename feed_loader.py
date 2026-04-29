import pandas as pd
import requests
from io import StringIO
from db import SessionLocal
from models import Product

# 🔥 YOUR REAL CAMPAIGNS STRUCTURE
CAMPAIGNS = [
    {
        "name": "movavi",
        "lc": "014538108972006513",
        "atid": "movavi",
        "feed_url": "PASTE_REAL_FEED_URL_HERE"
    },
    {
        "name": "buildasign",
        "lc": "014538059259004756",
        "atid": "buildasign",
        "feed_url": "PASTE_REAL_FEED_URL_HERE"
    },
    {
        "name": "combatflipflops",
        "lc": "014538089787006486",
        "atid": "combatflipflops",
        "feed_url": "PASTE_REAL_FEED_URL_HERE"
    }
]

# -------------------------
# AFFILIATE LINK BUILDER
# -------------------------
def build_affiliate(lc, atid, product_url):
    return f"https://www.linkconnector.com/ta.php?lc={lc}&atid={atid}&url={product_url}"

# -------------------------
# FETCH FEED (CSV VERSION)
# -------------------------
def fetch_csv(url):
    r = requests.get(url)
    r.raise_for_status()
    return pd.read_csv(StringIO(r.text))

# -------------------------
# SAVE PRODUCTS
# -------------------------
def save_products(df, campaign):
    session = SessionLocal()

    for _, row in df.iterrows():

        product_url = row.get("product_url") or row.get("url")

        if not product_url:
            continue

        affiliate_url = build_affiliate(
            campaign["lc"],
            campaign["atid"],
            product_url
        )

        product = Product(
            merchant=campaign["name"],
            title=row.get("title"),
            price=float(row.get("price", 0) or 0),
            image=row.get("image"),
            product_url=product_url,
            affiliate_url=affiliate_url
        )

        session.add(product)

    session.commit()
    session.close()

# -------------------------
# MAIN RUNNER
# -------------------------
def run_all_feeds():
    for c in CAMPAIGNS:
        try:
            print(f"🔄 Loading {c['name']}")

            df = fetch_csv(c["feed_url"])

            save_products(df, c)

            print(f"✅ Done {c['name']}")

        except Exception as e:
            print(f"❌ Failed {c['name']}: {e}")

if __name__ == "__main__":
    run_all_feeds()
