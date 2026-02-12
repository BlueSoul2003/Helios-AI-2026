import firebase_admin
from firebase_admin import credentials, db
import time
import random
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
FIREBASE_URL = os.getenv('FIREBASE_DATABASE_URL')
CRED_PATH = os.getenv('FIREBASE_CREDENTIALS', 'serviceAccountKey.json')

# Initialize Firebase
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate(CRED_PATH)
        firebase_admin.initialize_app(cred, {'databaseURL': FIREBASE_URL})
        print("✅ Firebase initialized successfully.")
    except Exception as e:
        print(f"❌ Firebase initialization failed: {e}")
        print("Make sure you have set up .env and serviceAccountKey.json correctly.")
        exit(1)

def generate_sensor_data(weather_condition):
    """Generates realistic sensor data based on weather."""
    base_voltage = 12.0 + random.uniform(-0.5, 0.5)
    
    if weather_condition == "Sunny":
        # High lux, sharp shadows (large difference between sensors if not aligned)
        lux_base = random.randint(3000, 5000)
        # Simulate misalignment: Top-Left is brighter
        lux_tl = lux_base + random.randint(200, 500)
        lux_tr = lux_base - random.randint(200, 500)
        lux_bl = lux_base - random.randint(100, 300)
        lux_br = lux_base - random.randint(100, 300)
        current = random.uniform(1.0, 1.5)
    elif weather_condition == "Cloudy":
        # Low lux, diffuse light (sensors are similar)
        lux_base = random.randint(500, 1000)
        lux_tl = lux_base + random.randint(-50, 50)
        lux_tr = lux_base + random.randint(-50, 50)
        lux_bl = lux_base + random.randint(-50, 50)
        lux_br = lux_base + random.randint(-50, 50)
        current = random.uniform(0.1, 0.4)
    else: # Night / Storm
        lux_base = random.randint(0, 100)
        lux_tl = lux_base
        lux_tr = lux_base
        lux_bl = lux_base
        lux_br = lux_base
        current = 0.0

    return {
        "voltage": round(base_voltage, 2),
        "current": round(current, 2),
        "humidity": random.randint(40, 95) if weather_condition == "Cloudy" else random.randint(30, 60),
        "temperature": random.uniform(25.0, 35.0),
        "rain_status": True if weather_condition == "Rain" else False,
        "lux_tl": lux_tl,
        "lux_tr": lux_tr,
        "lux_bl": lux_bl,
        "lux_br": lux_br
    }

def main():
    print("🚀 Virtual Helios: Hardware Simulator Started")
    print(f"Connecting to: {FIREBASE_URL}")

    # Simulation Loop
    while True:
        # Toggle weather every 10 iterations (approx 20 sec)
        timestamp = int(time.time())
        if (timestamp // 20) % 3 == 0:
            weather = "Sunny"
        elif (timestamp // 20) % 3 == 1:
            weather = "Cloudy"
        else:
            weather = "Rain"

        data = generate_sensor_data(weather)
        
        # Add timestamp and simulate mode
        payload = {
            "status": {
                "timestamp": timestamp,
                "simulated_weather": weather
            },
            "sensors": data
        }

        try:
            # Push to Firebase
            # We use 'update' to merge, or 'set' to overwrite. 
            # Ideally, hardware updates 'sensor_data' node.
            db.reference('/sensor_data').set(data)
            db.reference('/system_status').update(payload['status'])
            
            print(f"[{weather}] Sent: V={data['voltage']}V, Lux_TL={data['lux_tl']}...")
        except Exception as e:
            print(f"⚠️ Upload failed: {e}")

        time.sleep(2) # 2 seconds interval

if __name__ == "__main__":
    main()
