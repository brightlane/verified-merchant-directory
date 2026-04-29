from fastapi import FastAPI
from db import engine, SessionLocal
from models import Base, Product

app = FastAPI()

# create database tables on startup
Base.metadata.create_all(bind=engine)

@app.get("/")
def home():
    return {"status": "ok", "message": "Inventory system ready"}

@app.get("/products")
def get_products():
    session = SessionLocal()
    products = session.query(Product).all()

    return [
        {
            "title": p.title,
            "merchant": p.merchant,
            "price": p.price,
            "affiliate_url": p.affiliate_url
        }
        for p in products
    ]
