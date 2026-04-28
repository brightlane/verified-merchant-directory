CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    merchant_key TEXT NOT NULL,
    product_id TEXT,
    title TEXT,
    description TEXT,
    price REAL,
    image_url TEXT,
    product_url TEXT,
    category TEXT,
    slug TEXT UNIQUE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_merchant ON products(merchant_key);
CREATE INDEX idx_slug ON products(slug);
