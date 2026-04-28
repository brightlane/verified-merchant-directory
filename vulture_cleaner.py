import sqlite3
import datetime

def purge_old_records(threshold_hours=24):
    conn = sqlite3.connect('vulture_inventory.db')
    cursor = conn.cursor()
    
    # Calculate the cutoff time based on your sync frequency
    cutoff = datetime.datetime.now() - datetime.timedelta(hours=threshold_hours)
    
    # Delete products that haven't been updated in the last sync cycle
    cursor.execute("DELETE FROM products WHERE last_updated < ?", (cutoff,))
    
    deleted_count = cursor.rowcount
    conn.commit()
    conn.close()
    
    print(f"🧹 Purged {deleted_count} stale products from the inventory.")

if __name__ == "__main__":
    purge_old_records()
