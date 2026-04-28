import json
from datetime import datetime

def generate_daily_blog():
    with open('affiliate.json', 'r') as f:
        config = json.load(f)
    
    today = datetime.now().strftime('%B %d, %2026')
    
    # Example "Daily Intelligence" Content
    blog_post = f"""
    <article class="blog-post">
        <h2>Daily Market Update: {today}</h2>
        <p>The 2026 Global Partner Network is now live with 17 verified merchants. 
        Today's focus is on seasonal shifts in retail and travel planning for upcoming stadium events.</p>
        
        <h3>Featured Partner: HalloweenCostumes.com</h3>
        <p>With seasonal demand rising, our automated feeds have updated over 1,000 new listings 
        for event apparel. Check the merchant directory for the latest availability.</p>
        
        <h3>Travel Intelligence</h3>
        <p>Skyscanner data suggests a surge in mid-week flight bookings. 
        Our SoftLife Travel Network has refreshed its route maps accordingly.</p>
    </article>
    """

    # Read existing index/blog template and inject
    # For now, we'll create a simple standalone blog.html
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Travel & Merchant Intelligence | Brightlane Blog</title>
    <link rel="stylesheet" href="assets/style.css">
</head>
<body>
    <div class="container">
        <header><h1>Network Intelligence</h1><p>Daily Updates for the 10K Engine</p></header>
        <main>{blog_post}</main>
        <footer><a href="index.html">Return to Directory</a></footer>
    </div>
</body>
</html>"""

    with open("blog.html", "w") as f:
        f.write(html_content)
    print("✅ Daily Blog Intelligence updated.")

if __name__ == "__main__":
    generate_daily_blog()
