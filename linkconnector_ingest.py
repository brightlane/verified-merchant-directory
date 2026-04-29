import requests
import pandas as pd
from db import SessionLocal
from models import Product

# Example campaigns (you will expand to all 23)
CAMPAIGNS = [
    {
        "name": "movavi",
        "lc": "014538108972006513",
        "atid": "movavi",
        "feed_url": "https://example.com/movavi-feed.csv"  # replace later
    },
    {
        "name": "buildasign",
        "lc": "014538059259004756",
        "atid": "buildasign",
        "feed_url": "https://example.com/buildasign-feed.csv"
    }
]

def build_affiliate(lc, atid, product_url):
    return f"https://www.linkconnector.com/ta.php?lc={lc}&atid={atid}&url={product_url}"

def ingest_campaign(campaign):
    session = SessionLocal()

    print(f"🔄 Ingesting {campaign['name']}")

    df = pd.read_csv(campaign["feed_url"])

    for _, row in df.iterrows():

        product_url = row.get("product_url")

        affiliate_url = build_affiliate(
            campaign["lc"],
            campaign["atid"],
            product_url
        )

        product = Product(
            merchant=campaign["name"],
            title=row.get("title"),
            price=float(row.get("price", 0)),
            image=row.get("image"),
            product_url=product_url,
            affiliate_url=affiliate_url
        )

        session.add(product)

    session.commit()
    session.close()

    print(f"✅ Done: {campaign['name']}")

def run_all():
    for c in CAMPAIGNS:
        try:
            ingest_campaign(c)
        except Exception as e:
            print(f"❌ Failed {c['name']}: {e}")

if __name__ == "__main__":
    run_all()
