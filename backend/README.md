# Dual-Axis Solar Tracker - Software & AI Module

This project is the software core of the "Optics and Solar Energy" dual-axis automatic tracker. It integrates Google Gemini AI through Python scripts and combines real-time weather forecasts to achieve intelligent light-tracking decision-making.

## 🛠 Software Stack
- **Language**: Python 3.10+
- **AI Models**: Google Gemini 1.5 Flash / 2.0 Flash
- **Database**: Firebase Realtime Database
- **Core Libraries**: `google-genai`, `firebase-admin`

## 📊 Database Structure (Firebase Structure)

Data is stored in JSON format within the Realtime Database.

### 1. `/control_commands` (AI-Issued Commands)
The ESP32 needs to monitor this node to rotate the servos.
| Key | Type | Description |
| :--- | :--- | :--- |
| `mode` | String | `ai` (Smart Mode), `track` (Light Tracking), `diffuse` (Flat Storage) |
| `target_h` | Integer | Horizontal Angle (0-180) |
| `target_v` | Integer | Vertical Angle (0-180) |

### 2. `/weather_data` (AI Weather Analysis Results)
Used for display on the UI panel.
| Key | Type | Description |
| :--- | :--- | :--- |
| `condition` | String | Current weather description (e.g., Cloudy, Sunny) |
| `cloud_cover`| Integer | Cloud coverage (0-100%) |
| `suggestion` | String | Detailed operation suggestions provided by AI (Chinese/English) |

### 3. `/tracker_status` (Hardware Feedback Data)
The ESP32 should upload sensor data to this node.
| Key | Sub-node | Type | Description |
| :--- | :--- | :--- | :--- |
| `ldr_values` | `tl, tr, bl, br` | Integer | Raw numerical values of the four photoresistors (LDRs) |
| `power` | `voltage` | Float | Real-time solar panel voltage (V) |
| `power` | `current` | Float | Real-time solar panel current (A) |

## 🚀 Progress Updates
- [x] Firebase Realtime Database environment setup.
- [x] Python automation script development (implementing AI decision logic).
- [x] Implemented AI failover mechanism (automatically switches to a simulation algorithm if the API errors).
- [x] Successfully implemented cloud data synchronization.

## ⚠️ Development Notes (Tips for Teammates)
1. **Authentication**: Before running the script, you must prepare the `serviceAccountKey.json` file.
2. **ESP32 Connection**: Please use the `Firebase ESP Client` library for connection; the Database URL can be found in the console.
3. **Frequency**: Currently, the AI decision update frequency on the Python side is set to 60 seconds per cycle.
