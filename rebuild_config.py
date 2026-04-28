import json

def restore_merchant_config():
    config_data = {
        "affiliate_id": "014538",
        "merchants": {
            "abebooks": {"mid": "154194", "lc_id": "000007005123", "base_url": "https://www.abebooks.com"},
            "lyst": {"mid": "159279", "lc_id": "000007008899", "base_url": "https://www.lyst.com"},
            "halloweencostumes": {"mid": "88473", "lc_id": "000007004321", "base_url": "https://www.halloweencostumes.com"},
            "ticketbuyback": {"mid": "168507", "lc_id": "000007004455", "base_url": "https://www.ticketbuyback.com"},
            "wolters_kluwer": {"mid": "18340", "lc_id": "000007003224", "base_url": "https://shop.lww.com"},
            "la_fuente": {"mid": "1641", "lc_id": "000007001010", "base_url": "https://www.lafuente.com"},
            "chess_store": {"mid": "110813", "lc_id": "000007005057", "base_url": "https://thechessstore.com"},
            "build_a_sign": {"mid": "70695", "lc_id": "000007003322", "base_url": "https://www.buildasign.com"},
            "movavi": {"mid": "153105", "lc_id": "000007006123", "base_url": "https://www.movavi.com"},
            "combat_flip_flops": {"mid": "152912", "lc_id": "000007005544", "base_url": "https://www.combatflipflops.com"},
            "tenorshare": {"mid": "155657", "lc_id": "000007006847", "base_url": "https://www.tenorshare.com"},
            "wondershare": {"mid": "48130", "lc_id": "000007005679", "base_url": "https://www.wondershare.com"},
            "products_on_the_go": {"mid": "158029", "lc_id": "000007009988", "base_url": "https://www.potg.com"},
            "snappy": {"mid": "141940", "lc_id": "000007002211", "base_url": "https://www.snappy.com"},
            "infinite_aloe": {"mid": "167189", "lc_id": "000007007890", "base_url": "https://www.infinitealoe.com"},
            "viper_tec": {"mid": "153507", "lc_id": "000007006550", "base_url": "https://www.vipertecknives.com"},
            "rse_hair": {"mid": "166587", "lc_id": "000007007840", "base_url": "https://www.iseehair.com"}
        }
    }
    
    with open('approved_merchants.json', 'w') as f:
        json.dump(config_data, f, indent=4)
    print("✅ approved_merchants.json has been restored.")

if __name__ == "__main__":
    restore_merchant_config()
