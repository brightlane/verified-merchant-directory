import requests

# Your LinkConnector API Key (Found in your LC Account Settings)
API_KEY = "YOUR_LC_API_KEY_HERE" 

def download_approved_feeds():
    # List of MIDs for your 17 approved campaigns
    mids = [154194, 159279, 88473, 168507, 18340, 1641, 110813, 70695, 153105, 152912, 155657, 48130, 158029, 141940, 167189, 153507, 166587]
    
    for mid in mids:
        print(f"Fetching feed for MID: {mid}...")
        # LinkConnector feed retrieval endpoint
        url = f"https://api.linkconnector.com/v1/productfeeds?api_key={API_KEY}&mid={mid}&format=csv"
        
        response = requests.get(url)
        if response.status_code == 200:
            with open(f"feeds/feed_{mid}.csv", 'wb') as f:
                f.write(response.content)
            print(f"Saved MID {mid}")
        else:
            print(f"Failed to fetch MID {mid}")

# run this to update your local files
# download_approved_feeds()
