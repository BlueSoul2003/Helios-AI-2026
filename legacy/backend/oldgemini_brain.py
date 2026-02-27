from google import genai
import firebase_admin
from firebase_admin import credentials, db
import time
import json
import random
import os
from dotenv import load_dotenv
import weather_service  # Import the new weather service

# --- 1. 配置 (Configuration) ---
load_dotenv() # Load environment variables

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
FIREBASE_URL = os.getenv("FIREBASE_DATABASE_URL")
CRED_PATH = os.getenv("FIREBASE_CREDENTIALS", "serviceAccountKey.json")

# 初始化 Firebase (Initialize Firebase)
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate(CRED_PATH)
        firebase_admin.initialize_app(cred, {'databaseURL': FIREBASE_URL})
        print("✅ Firebase initialized successfully.")
    except Exception as e:
        print(f"❌ Firebase initialization failed: {e}")
        exit(1)

# 初始化 Gemini Client (Initialize Gemini)
if not GEMINI_API_KEY:
    print("❌ GEMINI_API_KEY not found in .env")
    exit(1)

client = genai.Client(api_key=GEMINI_API_KEY)

# 备选模型列表 (Model Selection)
# 备选模型列表 (Model Selection)
MODEL_NAME = "gemini-2.0-flash-lite-preview-02-05"

# Safety Thresholds
HUMIDITY_THRESHOLD = 80.0

def get_sensor_data():
    """Fetch real-time sensor data from Firebase."""
    try:
        data = db.reference('/sensor_data').get()
        if data:
            return data
    except Exception as e:
        print(f"⚠️ Failed to fetch sensor data: {e}")
    return None

def get_ai_decision(weather_desc, cloud_cover, sensor_data):
    """
    Get decision from Gemini or Safety Logic.
    sensor_data: dict containing 'humidity', 'rain_status', 'lux_tl', etc.
    """
    
    # --- 1. Safety Check (Hard-coded) ---
    if sensor_data:
        is_raining = sensor_data.get('rain_status', False)
        humidity = sensor_data.get('humidity', 0)
        
        if is_raining or humidity > HUMIDITY_THRESHOLD:
            print(f"🚨 SAFETY ALERT: Rain: {is_raining}, Humidity: {humidity}%")
            return {
                "mode": "safety",
                "target_h": 0,
                "target_v": 0,
                "suggestion": f"SAFETY PARAMETER TRIGGERED. Rain: {is_raining}, Humidity: {humidity}%. Retracting panel."
            }, "Safety Protocol"

    # --- 2. AI Decision ---
    prompt = f"""
    Context:
    - API Weather: {weather_desc}, Cloud cover: {cloud_cover}%
    - Local Sensors: {json.dumps(sensor_data) if sensor_data else "N/A"}
    
    Task: Compare API weather with local sensor data. 
    If sensors indicate rain or dark storm clouds (low lux) despite API saying clear, prioritize sensors.
    
    Return ONLY a raw JSON object: 
    {{
        "mode": "ai", 
        "target_h": [0-180], 
        "target_v": [0-90], 
        "suggestion": "Analysis of weather vs sensors. Reasoning for angle."
    }}
    """
    
    try:
        # 尝试调用 AI
        response = client.models.generate_content(model=MODEL_NAME, contents=prompt)
        res_text = response.text.strip().replace('```json', '').replace('```', '')
        return json.loads(res_text), "Real AI"
    except Exception as e:
        # --- Plan B: 本地逻辑 (当 API 限制或 404 时) ---
        print(f"⚠️ AI 暂时不可用 (Error: {str(e)[:30]}), 切换至本地智能算法...")
        if cloud_cover > 70:
            return {
                "mode": "diffuse",
                "target_h": 90,
                "target_v": 0,
                "suggestion": "Detection: Heavy clouds. AI suggested 'Diffuse Mode' (flat position)."
            }, "Simulated AI"
        else:
            return {
                "mode": "track",
                "target_h": random.randint(80, 100),
                "target_v": 45,
                "suggestion": "Detection: Clear sky. AI is guiding the tracker to optimal sun position."
            }, "Simulated AI"

# --- 主循环 (Main Loop) ---
if __name__ == "__main__":
    print(f"🚀 太阳能追踪器 AI 大脑已启动 (使用模型: {MODEL_NAME})")

    while True:
        # 获取实时天气数据 (Get Real-time Weather)
        print("\n[获取天气数据中...] Connecting to OpenWeatherMap...")
        weather_now, cloud_now = weather_service.get_current_weather()

        if weather_now is None:
            print("⚠️ 无法获取实时天气，切换回模拟数据。")
            weather_now = "Cloudy (Simulated)"
            cloud_now = 85
        else:
            print(f"🌤️ 实时天气: {weather_now}, 云量: {cloud_now}%")

        # 获取传感器数据 (Get Sensor Data)
        sensor_data = get_sensor_data()
        if sensor_data:
             print(f"📡 传感器数据: Humidity={sensor_data.get('humidity')}%, Rain={sensor_data.get('rain_status')}, LuxAvg={sensor_data.get('lux_tl')}")

        print(f"[分析中...] 请求 AI 决策...")
        decision, source = get_ai_decision(weather_now, cloud_now, sensor_data)
        
        try:
            # 更新 Firebase 天气建议
            db.reference('/weather_data').update({
                "condition": f"{weather_now} ({source})",
                "cloud_cover": cloud_now,
                "suggestion": decision.get('suggestion')
            })
            # 更新 Firebase 舵机指令
            db.reference('/control_commands').update({
                "target_h": decision.get('target_h'),
                "target_v": decision.get('target_v'),
                "mode": "ai"
            })
            print(f"✅ Firebase 同步成功！来源: {source}")
            print(f"💡 AI 建议: {decision.get('suggestion')}")
        except Exception as fb_err:
            print(f"❌ Firebase 写入失败: {fb_err}")

        # 每 60 秒运行一次，保护 API 配额 (Wait 60s)
        print("等待 60 秒进行下次决策...")
        time.sleep(60)
