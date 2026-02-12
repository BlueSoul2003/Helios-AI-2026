# Helios AI ☀️
**Smart Dual-Axis Solar Tracker Powered by Google Gemini**
**Project for Kitahack 2026 from The Singularity group**

## 📖 Introduction
Helios AI solves the inefficiency of static solar panels by using a dual-axis tracking system. Unlike traditional trackers, we utilize **Google Gemini** to analyze weather patterns and optimize the panel's angle for maximum energy output (or protection during storms).

## 🎯 SDG Alignment
* **SDG 7:** Affordable and Clean Energy
* **SDG 13:** Climate Action

## 🛠 Tech Stack
* **Hardware:** ESP32, MG996R Servos, LDR Sensors, Bambu Lab 3D Printed Parts.
* **Google Cloud:** Firebase Realtime Database.
* **AI:** Google Gemini API (Multimodal analysis).
* **Frontend:** Flutter / Web Dashboard.

## 🚀 How to Run
1.  **Hardware:** Flash the code in `/hardware/firmware` to an ESP32.
2.  **Backend:**
    * `cd backend`
    * `pip install -r requirements.txt`
    * Create a `.env` file with `GEMINI_API_KEY=your_key`
    * Run `python app.py`
3.  **Frontend:** Open `/frontend` and run via Flutter/Web.

## 👥 Team
* Wong Wei Xiang - Hardware Lead
* Gregory Hong Shyang Zhao - Embedded Engineer
* Lim Xin Yang - AI Backend Developer
* Chiang Ming Wei - Frontend Developer
