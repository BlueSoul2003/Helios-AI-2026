from google import genai
import firebase_admin
from firebase_admin import credentials, db
import time
import json
import random
import os
from dotenv import load_dotenv
import weather_service  # 你的天气服务模块
from datetime import datetime

# --- 1. 配置 (Configuration) ---
load_dotenv() 

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
FIREBASE_URL = os.getenv("FIREBASE_DATABASE_URL")
CRED_PATH = os.getenv("FIREBASE_CREDENTIALS", "serviceAccountKey.json")

# 初始化 Firebase
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate(CRED_PATH)
        firebase_admin.initialize_app(cred, {'databaseURL': FIREBASE_URL})
        print("✅ Firebase initialized successfully.")
    except Exception as e:
        print(f"❌ Firebase initialization failed: {e}")
        exit(1)

# 初始化 Gemini Client
client = genai.Client(api_key=GEMINI_API_KEY)
MODEL_NAME = "gemini-2.0-flash-lite-preview-02-05"

# 安全阈值
HUMIDITY_THRESHOLD = 80.0

def get_sensor_data():
    """从 Firebase 获取实时硬件传感器数据"""
    try:
        data = db.reference('/sensor_data').get()
        return data
    except Exception as e:
        print(f"⚠️ Failed to fetch sensor data: {e}")
    return None

def get_ai_decision(weather_desc, cloud_cover, sensor_data):
    """请求 AI 决策，包含安全逻辑"""
    
    # 1. 硬件安全检测 (下雨或湿度过高优先处理)
    if sensor_data:
        is_raining = sensor_data.get('rain_status', False)
        humidity = sensor_data.get('humidity', 0)
        
        if is_raining or humidity > HUMIDITY_THRESHOLD:
            print(f"🚨 SAFETY ALERT: Rain: {is_raining}, Humidity: {humidity}%")
            return {
                "mode": "safety",
                "target_h": 90, # 归位
                "target_v": 0,  # 平放保护电机
                "suggestion": f"SAFETY TRIGGERED. Rain/Humidity high. Retracting panel."
            }, "Safety Protocol"

    # 2. AI 智能决策逻辑
    prompt = f"""
    Context:
    - API Weather: {weather_desc}, Cloud cover: {cloud_cover}%
    - Local Sensors: {json.dumps(sensor_data) if sensor_data else "N/A"}
    
    Task: Compare API weather with local sensor data. 
    Return ONLY a raw JSON object: 
    {{
        "mode": "ai", 
        "target_h": 90, 
        "target_v": 45, 
        "suggestion": "reasoning here"
    }}
    """
    
    try:
        response = client.models.generate_content(model=MODEL_NAME, contents=prompt)
        res_text = response.text.strip().replace('```json', '').replace('```', '')
        return json.loads(res_text), "Real AI"
    except Exception as e:
        print(f"⚠️ AI 暂时不可用, 切换至本地智能算法...")
        if cloud_cover > 70:
            return {"mode": "diffuse", "target_h": 90, "target_v": 0, "suggestion": "Heavy clouds detected. Diffuse mode."}, "Simulated AI"
        else:
            return {"mode": "track", "target_h": 90, "target_v": 45, "suggestion": "Clear sky. Tracking sun."}, "Simulated AI"

# --- 🚀 主循环 (Main Loop) ---
if __name__ == "__main__":
    print(f"🚀 太阳能追踪器 AI 大脑已启动 (使用模型: {MODEL_NAME})")

    while True:
        # 1. 获取当前时间戳
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # 2. 获取实时天气
        print(f"\n[{current_time}] 获取气象数据中...")
        weather_now, cloud_now = weather_service.get_current_weather()
        
        # 3. 获取传感器数据
        sensor_data = get_sensor_data()

        # 4. 获取 AI 决策
        decision, source = get_ai_decision(weather_now, cloud_now, sensor_data)
        
        try:
            # 5. 更新 Firebase 实时状态 (供硬件和 UI 使用)
            db.reference('/weather_data').update({
                "condition": f"{weather_now} ({source})",
                "cloud_cover": cloud_now,
                "suggestion": decision.get('suggestion'),
                "last_updated": current_time
            })
            
            db.reference('/control_commands').update({
                "target_h": decision.get('target_h'),
                "target_v": decision.get('target_v'),
                "mode": decision.get('mode')
            })

            # 🚀 6. 记录到历史节点 (History Logging)
            history_entry = {
                "timestamp": current_time,
                "weather": weather_now,
                "cloud_cover": cloud_now,
                "target_h": decision.get('target_h'),
                "target_v": decision.get('target_v'),
                "source": source,
                # 记录当时的传感器状态
                "humidity": sensor_data.get('humidity') if sensor_data else 0,
                "is_raining": sensor_data.get('rain_status') if sensor_data else False
            }
            db.reference('/history').push(history_entry)
            
            print(f"✅ Firebase 更新成功，且历史已存档！")
            print(f"💡 AI 建议: {decision.get('suggestion')}")

        except Exception as fb_err:
            print(f"❌ Firebase 写入失败: {fb_err}")

        # 每 60 秒运行一次
        print("等待 60 秒进行下次决策...")

        time.sleep(60)
