import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENWEATHER_API_KEY").strip() if os.getenv("OPENWEATHER_API_KEY") else None
LAT = os.getenv("LATITUDE", "3.1390") # Default: Kuala Lumpur
LON = os.getenv("LONGITUDE", "101.6869")

def get_current_weather():
    """
    Fetches current weather data from OpenWeatherMap.
    Returns:
        tuple: (weather_condition, cloud_cover_percentage)
        or (None, None) if request fails.
    """

    if not API_KEY:
        print("⚠️ OPENWEATHER_API_KEY not found in .env")
        return None, None
    
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={LAT}&lon={LON}&appid={API_KEY}&units=metric"

    
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        # Extract meaningful data
        weather_condition = data['weather'][0]['main'] # e.g., 'Clouds', 'Clear', 'Rain'
        cloud_cover = data['clouds']['all'] # Percentage 0-100
        
        return weather_condition, cloud_cover
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Weather API Error: {e}")
        return None, None

if __name__ == "__main__":
    # Test the function
    condition, clouds = get_current_weather()
    print(f"Weather: {condition}, Clouds: {clouds}%")
