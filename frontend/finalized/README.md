# Helios AI - Solar Tracker Dashboard

This repository contains the frontend User Interface (UI) for the **Helios AI Dual-Axis Solar Tracker** project. The dashboard provides a comprehensive, modern, and interactive interface to monitor and control a physical solar tracking system in real-time.

## UI Explanation

The dashboard is designed with a sleek, glassmorphism aesthetic and consists of four primary sections:

1. **Weather Insights**: Displays live environmental data including temperature, humidity, cloud cover, and rain status, offering intelligent suggestions based on current conditions.
2. **Remote Control**: Allows users to seamlessly switch between **AI (Automatic)** and **MANUAL** modes. In manual mode, an on-screen D-Pad enables precise tilt (Vertical) and rotation (Horizontal) adjustments of the solar panels.
3. **Live Visualization**: A dynamic 3D rendering (built with Three.js) that visualizes the sun's actual astronomical trajectory relative to the physical location (Skudai, Johor), the panel's current orientation, and the real-time weather conditions.
4. **LDR Irradiance**: Shows live light intensity readings (in Lux) and voltage from four individual Light Dependent Resistors (TL, TR, BL, BR), allowing users to monitor exactly how much sunlight each corner of the tracker is receiving.

---

## Google Technologies Used

This project leverages the following Google technologies:

- **Google Firebase**: Realtime Database is used as the core communication bridge between the IoT hardware (solar tracker) and this web frontend. It enables instant data sync for telemetry and remote control commands.
- **Google Gemini AI**: Gemini played a crucial role in assisting with the code generation, writing complex HTML/JS structures, parsing logic, and troubleshooting development hurdles during the creation of this UI.

---

## Development Challenges Faced

Building this interactive 3D dashboard presented several unique challenges:

1. **AI Agent Limitations**: Initially, the Antigravity AI coding assistant struggled to generate the exact expected visual figures and layout in the HTML file directly. It occasionally got stuck for extended periods without completing tasks, requiring manual intervention, agent restarts, and complete system reboots.
2. **Bridging the Gap with Gemini**: To overcome Antigravity's initial mapping issues, Google Gemini was utilized independently to create base HTML files and craft specific, highly detailed prompts. These prompts were then fed back to Antigravity so it could perfectly understand the required structural intent.
3. **Rapid Prototyping with Flutterflow**: Because raw code generation of complex UIs proved time-consuming and error-prone initially, a rough UI was quickly mocked up using **Flutterflow**. This provided a tangible, visual reference that significantly sped up the final web implementation by acting as a clear blueprint for the AI to follow.
4. **Astronomical Math & 3D**: Mapping real-world sun positioning (azimuth, elevation) onto a customized Three.js 2D/3D hybrid arc without causing the sun or moon models to clip incorrectly required extensive mathematical tweaking.

---

## UI Function Analysis

The core logic of the dashboard is driven by `app.js`. Key functions include:

*   **`initThreeJS()` & `animateThreeJS()`**: Initializes the 3D scene (Earth dome, panel pivot, celestial path) and continuously renders frames. Maps real-world time to the sun/moon position on the UI arc.
*   **`fetchTrackerData()`**: Asynchronously fetches telemetry and system status from the Firebase Realtime Database at a regular interval (defined in `config.js`). It triggers UI updates upon successful data retrieval.
*   **`patchFirebase()`**: Handles sending control commands (e.g., target angles, mode changes) back to the Firebase database to physically move the tracker.
*   **`updateUI(data)`**: The central parser. It splits the raw string from Firebase (e.g., `CLEAR, AUTO, ...`), extracts sensor data, target angles, and weather conditions, and updates the corresponding HTML DOM elements.
*   **`updateAdvancedViz(azimuth, elevation)`**: Translates the tracker's current horizontal and vertical angles into Three.js object rotations (`panelPivot.rotation.z` and `.x`), allowing the 3D model to mirror the real hardware.
*   **`updateWeatherEffects(condition)`**: Dynamically changes the 3D scene lighting, sun/moon 2D sprite textures, and floating weather emojis based on the reported weather conditions (e.g., Sunny, Cloudy, Rain).
*   **D-Pad Logic (`adjust`, `startHold`, `stopHold`)**: Event listeners that process interactions with the manual control D-Pad. Includes logic for single clicks and "long-press acceleration" for faster continuous manual movement.

---

## Setup Instructions

**Important:** Do NOT commit your actual Firebase URLs to GitHub.

To run this dashboard locally:

1. Clone or download this repository.
2. Rename the file `config.example.js` to `config.js`.
3. Open `config.js` in a text editor and replace `YOUR_FIREBASE_URL_HERE` with your actual Firebase Realtime Database URLs.
4. Open `index.html` in any modern web browser to view the dashboard. No build step or local server is required.
