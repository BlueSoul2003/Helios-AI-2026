# ☀️ Helios AI: Smart Predictive Solar Tracker
**Project for KitaHack 2026 | Team: The Singularity**

[![Demonstration Video](https://img.shields.io/badge/Watch-Demo_Video-FF0000?style=for-the-badge&logo=youtube)](#) 

## 📖 1. Introduction & Problem Statement
Static solar panels lose up to 40% of potential energy by not facing the sun. While traditional Dual-Axis Trackers exist, they rely purely on physical LDR (Light Dependent Resistor) sensors. This creates the **"Net-Positive Energy Flaw"**: on cloudy or overcast days, the tracker "hunts" for light, causing the servo motors to consume more electricity than the solar panels generate. 

**Helios AI** solves this by fusing physical IoT sensors with predictive AI. We utilize **Google Gemini** to analyze real-time weather data and historical sensor inputs to make mathematically sound decisions—optimizing the panel's angle for maximum energy output or putting it into "Power-Saving/Safe Mode" during storms.

## 🎯 2. SDG Alignment & Justification
* **SDG 7: Affordable and Clean Energy:** By preventing wasteful motor movements on cloudy days and maximizing exposure on sunny days, Helios AI ensures that the net energy yield is strictly positive, making solar tracking more economically viable.
* **SDG 13: Climate Action:** Extreme weather events are increasing. Helios AI uses Gemini to predict storms and automatically flattens the solar array (Safe Mode) to reduce wind resistance, building climate-resilient infrastructure.

## 🧠 3. AI Integration & Technology Innovation
Why use an LLM for a hardware project? 
Simple logic (`if cloudy then stop`) is insufficient for complex environmental factors. **Google Gemini API (Multimodal)** acts as our central brain. It ingests a JSON payload of real-time LDR discrepancies, voltage drops, and weather APIs. It doesn't just read data; it *reasons* whether the energy cost of moving the physical panels is justified by the expected solar gain in the next hour. 

## 🏗 4. System Architecture & Google Technologies

<img width="2560" height="1664" alt="architecture" src="https://github.com/user-attachments/assets/a855994c-d173-4063-a15a-60f15dcaf586" />

Our architecture is designed for low-latency IoT control and intelligent decision-making, heavily relying on the **Google Technology Stack**:
* **Google Firebase (Realtime Database):** Chosen as our central state manager. It perfectly solves the latency and polling overhead of traditional REST APIs, allowing our Hardware, AI, and Frontend to sync in milliseconds.
* **Google Gemini API:** The predictive reasoning engine hosted via a Python backend.
* **Flutter:** Used to build our cross-platform, responsive dashboard that visualizes real-time Firebase data beautifully.
* **Hardware Edge:** Arduino UNO R4 WiFi, SG90 Micro Servos (lightweight prototyping), LDR Sensors, and a custom dual-axis mechanism fabricated using a Bambu Lab A1 3D printer.

## 🚧 5. Major Technical Challenge & Implementation
**The Challenge:** Asynchronous State Desynchronization. 
Initially, the Arduino hardware and the Python (Gemini) backend were fighting for control over the servo motors, causing severe hardware jitter and latency.
**The Resolution:** We implemented a "Single Source of Truth" architecture using **Firebase**. We decoupled the hardware from the AI. The Arduino strictly reads the `control/mode` node from Firebase (either MANUAL or AI_AUTO). The Python script independently runs Gemini analysis and updates Firebase. This architectural decision eliminated all jitter and made the system incredibly stable.

## 🗣 6. User Feedback & Iterations
During our prototyping phase, we gathered feedback from 3 target users (homeowners with solar interests and physics peers) and iterated:
1. **Insight:** "The raw voltage/LDR data on the screen is too confusing for normal users."
   * **Iteration:** We updated the Flutter dashboard to include intuitive Circular Gauges and a dedicated "AI Insight Card" that explains Gemini's decision in plain English.
2. **Insight:** "What happens if there's a strong wind? The panels act like sails."
   * **Iteration:** We modified the Gemini prompt to aggressively check for wind speed/storm warnings. We programmed a `flatten_panel()` hardware override when Gemini detects severe weather.
3. **Insight:** "The motors make an annoying adjusting sound constantly when clouds pass."
   * **Iteration:** We added a "tolerance threshold" algorithm before sending data to Gemini, ensuring the tracker only moves when the light angle shifts significantly.

## 📈 7. Success Metrics & Scalability Roadmap

**Target Metrics:** We measure success by the "Net Energy Gain Ratio." The system is considered successful if the AI-driven tracker generates at least 25% more power than a static panel, while using 15% less motor energy than a "dumb" continuous LDR-only tracker.

### 🚀 The Helios AI Scaling Roadmap

* **Phase 1: Proof of Concept & Validation (Current - Hackathon)**
  * ✅ Build a functional dual-axis prototype using Arduino UNO R4, SG90 servos, and 3D printed parts.
  * ✅ Establish real-time sync via Firebase and integrate Gemini API for basic weather/LDR decision-making.
  * ⏳ Validate the "Net-Positive Energy Flaw" hypothesis against static panels.

* **Phase 2: "Swarm" Architecture & Edge Upgrades (Months 3-6)**
  * **Hardware Upgrade:** Transition from SG90 micro servos to industrial NEMA stepper motors capable of moving commercial 400W solar panels.
  * **Swarm Intelligence:** Instead of every panel calling the Gemini API (which is costly and slow), implement a "Master-Slave" mesh network. The central Firebase hub makes **one** Gemini API call and broadcasts the optimized angle to a "swarm" of 100+ local trackers via Firebase Cloud Messaging.
  * **Predictive Maintenance:** Train the AI to detect anomalies (e.g., if predicted power output > actual output, the App alerts the user: *"Panel 3 might be dirty or damaged"*).

* **Phase 3: Real-World Pilot Deployment (Months 6-12)**
  * Deploy a pilot batch of 5-10 Helios AI nodes on a local university campus or residential roofs in Johor.
  * Upgrade the Flutter App for homeowners, including Return on Investment (ROI) tracking, energy saving reports, and manual override controls.
  * Collect longitudinal data on hardware durability under tropical weather conditions (heavy rain and high heat).

* **Phase 4: Commercialization & Smart Grid Integration (Year 2+)**
  * Target B2B solar farms, offering Helios AI as a retrofitting kit for existing static solar arrays.
  * Integrate with national smart grid APIs to flatten panels during low-demand hours or optimize angles based on real-time electricity pricing.
## 🚀 8. How to Run
1. **Hardware:** Flash the code in `/hardware/firmware` to the Arduino UNO R4 WiFi via the Arduino IDE.
2. **Backend:**
   * `cd backend`
   * `pip install -r requirements.txt`
   * Create a `.env` file with `GEMINI_API_KEY=your_key`
   * Run `python app.py`
3. **Frontend:** Open `/frontend` and run via Flutter/Web.

## 👥 9. Team The Singularity
* **Wong Wei Xiang** - Hardware Lead (3D Fabrication & Circuitry)
* **Gregory Hong Shyang Zhao** - IoT Systems Architect (Data & Logic)
* **Lim Xin Yang** - AI Backend Developer (Python & Gemini Logic)
* **Chiang Ming Wei** - Frontend Developer (Flutter UI/UX)
