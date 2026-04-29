import pandas as pd
from db import SessionLocal, engine
from models import Base, Product

# ensure tables exist
Base.metadata.create_all(bind=engine)

def build_affiliate_url(product_url: str, lc_id: str, atid: str):
    return f"https://www.linkconnector.com/ta.php?lc={lc_id}&atid={atid}&url={product_url}"

def ingest_csv(file_path, merchant, lc_id, atid):
    session = SessionLocal()

    df = pd.read_csv(file_path)

    for _, row in df.iterrows():

        product_url = row.get("product_url")

        affiliate_url = build_affiliate_url(product_url, lc_id, atid)

        product = Product(
            merchant=merchant,
            title=row.get("title"),
            price=float(row.get("price", 0)),
            image=row.get("image"),
            product_url=product_url,
            affiliate_url=affiliate_url
        )

        session.add(product)

    session.commit()
    session.close()

    print(f"✅ Ingested {merchant}")

if __name__ == "__main__":

    # EXAMPLE (replace with real feed file later)
    ingest_csv(
        file_path="data/sample_feed.csv",
        merchant="movavi",
        lc_id="014538108972006513",
        atid="movavi"
    )
