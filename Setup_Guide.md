# Helios AI - Dual-Axis Solar Tracker: Complete Setup Guide

Welcome to the Helios AI Solar Tracker project! This step-by-step guide is written specifically for beginners. It will walk you through setting up every part of the system: the Cloud Database, the ESP32 Hardware, the Python AI Backend, and the Web Dashboard.

By the end of this guide, you will have a fully functioning solar tracker that uses real-world weather data and Google Gemini AI to optimize its angle, alongside a beautiful 3D web dashboard to monitor it.

---

## 📋 What You Need Before You Start

### 1. Accounts to Create (All Free)
*   **Google Account**: Required for Firebase and Gemini AI.
*   **OpenWeatherMap Account**: Required to get real-time weather data. [Sign up here](https://home.openweathermap.org/users/sign_up).

### 2. Software to Install
*   **Arduino IDE**: For uploading code to the Arduino Uno R4. [Download here](https://www.arduino.cc/en/software).
*   **Python (3.10 or newer)**: For running the AI logic. [Download here](https://www.python.org/downloads/).
*   **VS Code (Recommended)**: A great text editor for modifying the frontend and backend files. [Download here](https://code.visualstudio.com/).

### 3. Hardware Requirements
*   1x Arduino Uno R4 WiFi
*   2x Servo Motors (SG90 or MG996R)
*   4x LDRs (Light Dependent Resistors/Photoresistors)
*   4x 10k Ohm Resistors (for the LDR voltage dividers)
*   1x Rain Sensor Module
*   Jumper wires & Breadboard

---

## Phase 1: Setting up the Cloud (Firebase)

Firebase is the "bridge" that connects your Hardware, your AI Backend, and your Web Dashboard together in real-time.

1.  Go to the [Firebase Console](https://console.firebase.google.com/) and click **"Create a project"**. Name it something like *Helios-Tracker*.
2.  Once the project is created, click **"Build"** in the left menu, then select **"Realtime Database"**.
3.  Click **"Create Database"**. Choose a location closest to you (e.g., Singapore) and start in **Test Mode** (this allows reading and writing easily for now).
4.  **Important:** At the top of your new database, you will see a URL (e.g., `https://helios-tracker-xxxx.asia-southeast1.firebasedatabase.app/`). **Copy this URL and save it somewhere safe. This is your `DATABASE_URL`.**

### Getting the Web API Key
1.  Click the **Gear Icon** (Project Settings) in the top left menu next to "Project Overview".
2.  On the "General" tab, look for the **Web API Key**. **Copy this and save it. This is your `Web_API_KEY`.**

### Getting the Service Account Key (For the Python AI)
1.  Still in **Project Settings**, go to the **"Service accounts"** tab.
2.  Click **"Generate new private key"**.
3.  A `.json` file will download to your computer. **Rename this file to `serviceAccountKey.json`**.
4.  Move this `serviceAccountKey.json` file directly into the `backend/` folder of this project.

---

## Phase 2: Setting up the Hardware (Arduino Uno R4 WiFi)

Now we will tell the physical solar tracker how to connect to your WiFi and your new Firebase database.

### 1. Install Arduino Libraries
1.  Open **Arduino IDE**.
2.  Go to **Sketch > Include Library > Manage Libraries**.
3.  Search for and install the following libraries:
    *   `FirebaseClient` (by Mobizt)
    *   `ArduinoJson` (by Benoit Blanchon)
    *   (The standard `WiFiS3` and `Servo` libraries are built-in for the Uno R4)

### 2. Configure the Firmware
1.  Open the file `hardware/firmware/Solar_Tracker_1.1/Solar_Tracker_1.1.ino` in the Arduino IDE.
2.  Find the configuration section at the top of the file (around line 10) and replace the placeholders with your actual details:
    ```cpp
    #define WIFI_SSID "YOUR_HOME_WIFI_NAME"
    #define WIFI_PASSWORD "YOUR_HOME_WIFI_PASSWORD"
    #define DATABASE_URL "YOUR_PROJECT_ID.asia-southeast1.firebasedatabase.app" // DO NOT include "https://" or trailing "/"
    #define Web_API_KEY "YOUR_FIREBASE_WEB_API_KEY" // Paste the API key you saved earlier
    ```
3.  Ensure your Arduino Uno R4 WiFi is plugged into your computer via USB.
4.  Select your board (Arduino UNO R4 WiFi) and port in Arduino IDE (`Tools > Board` and `Tools > Port`).
5.  Click the **Upload** button (the right arrow icon). Wait for it to finish compiling and uploading.

*Note: The hardware is now programmed to read the LDRs, move the servos, and sync with Firebase.*

---

## Phase 3: Setting up the AI Brain (Backend)

The Python backend acts as the "Brain". It checks the weather, asks Gemini AI what to do, and sends commands to Firebase (which the Arduino Uno R4 then reads).

### 1. Get API Keys
*   **Gemini AI**: Go to [Google AI Studio](https://aistudio.google.com/app/apikey), sign in, and click "Create API key". Copy it.
*   **OpenWeatherMap**: Log into your OpenWeather account, go to "My API Keys", and generate a key. Copy it.

### 2. Configure the Environment
1.  Navigate to the `backend/` folder on your computer.
2.  Rename the file `.env.example` to just `.env`. (If `.env.example` doesn't exist, create a new text file named `.env`).
3.  Open `.env` in a text editor (like VS Code or Notepad) and fill in your details:
    ```env
    # Firebase Configuration
    FIREBASE_DATABASE_URL="https://YOUR_PROJECT_ID.asia-southeast1.firebasedatabase.app/" # MUST include https:// and ending /
    FIREBASE_CREDENTIALS="serviceAccountKey.json"

    # Google Gemini API
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

    # Open Weather API
    OPENWEATHER_API_KEY = "YOUR_OPENWEATHER_API_KEY"
    LATITUDE = "1.5437"   # Your City Latitude (Default: Skudai)
    LONGITUDE = "103.6366" # Your City Longitude
    ```
    *(Make sure your `serviceAccountKey.json` from Phase 1 is in this `backend/` folder!)*

### 3. Run the AI Script
1.  Open a terminal (or Command Prompt) and navigate to the `backend/` folder.
2.  Install the required Python packages by running:
    ```bash
    pip install -r requirements.txt
    ```
3.  Start the AI Brain by running:
    ```bash
    python gemini_brain.py
    ```
4.  You should see logs appearing every 60 seconds, indicating that it is fetching weather, asking Gemini, and updating Firebase. Keep this terminal open!

---

## Phase 4: Setting up the Web Dashboard (Frontend)

Finally, let's connect the beautiful 3D web interface so you can monitor everything visually.

### 1. Configure the Dashboard
1.  Navigate to the `frontend/` folder.
2.  Rename the file `config.example.js` to `config.js`.
3.  Open `config.js` in a text editor and add your Firebase URL:
    ```javascript
    const CONFIG = {
        // MUST end exactly like this: /.json
        firebaseUrl: 'https://YOUR_PROJECT_ID.asia-southeast1.firebasedatabase.app/.json',
        // MUST end exactly like this: /control_commands.json
        controlUrl: 'https://YOUR_PROJECT_ID.asia-southeast1.firebasedatabase.app/control_commands.json',
        fetchInterval: 5000,
        location: {
            lat: 1.5437,   
            lon: 103.6366  
        }
    };
    ```

### 2. Run the Dashboard
Because this dashboard is built with pure HTML, CSS, and JS, **you don't need any special servers to run it locally**.

1.  Simply double-click the `index.html` file inside the `frontend/` folder to open it in your web browser (Chrome, Edge, Safari, etc.).
2.  The dashboard should load. If you completed Phase 1, 2, and 3 correctly, the "Connecting..." badge in the top right will turn green and say "Live Data", and the 3D panel will begin to match your physical hardware!

---

🎉 **Congratulations!** You have fully deployed the Helios AI Dual-Axis Solar Tracker. 

*   The **hardware** tracks the sun locally using LDR sensors.
*   The **AI backend** watches the weather and intervenes if it's cloudy or raining.
*   The **frontend** gives you a God's-eye view of the entire operation.
