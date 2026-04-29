from sqlalchemy import Column, Integer, String, Float
from db import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    merchant = Column(String, index=True)
    title = Column(String)
    price = Column(Float, default=0.0)

    image = Column(String)
    product_url = Column(String)

    affiliate_url = Column(String)
