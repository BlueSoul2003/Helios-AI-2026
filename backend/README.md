# Dual-Axis Solar Tracker - Software & AI Module

本项目是“光学与太阳能”双轴自动追踪器的软件核心。通过 Python 脚本接入 Google Gemini AI，结合实时天气预报，实现智能追光决策。

## 🛠 软件架构 (Software Stack)
- **语言**: Python 3.10+
- **AI 模型**: Google Gemini 1.5 Flash / 2.0 Flash
- **数据库**: Firebase Realtime Database
- **核心库**: `google-genai`, `firebase-admin`

## 📊 数据库结构 (Firebase Structure)

数据以 JSON 格式存储在 Realtime Database 中。

### 1. `/control_commands` (AI 发出的指令)
ESP32 需要监听此节点来转动舵机。
| 键名 (Key) | 类型 (Type) | 说明 (Description) |
| :--- | :--- | :--- |
| `mode` | String | `ai` (智能模式), `track` (追光), `diffuse` (平放) |
| `target_h` | Integer | 水平角度 (0-180) |
| `target_v` | Integer | 垂直角度 (0-180) |

### 2. `/weather_data` (AI 天气分析结果)
用于展示在 UI 面板上。
| 键名 (Key) | 类型 (Type) | 说明 (Description) |
| :--- | :--- | :--- |
| `condition` | String | 当前天气描述 (如: Cloudy, Sunny) |
| `cloud_cover`| Integer | 云层覆盖率 (0-100%) |
| `suggestion` | String | AI 给出的详细操作建议（中文/英文） |

### 3. `/tracker_status` (硬件反馈数据)
ESP32 应将传感器数据上传至此。
| 键名 (Key) | 子节点 | 类型 | 说明 |
| :--- | :--- | :--- | :--- |
| `ldr_values` | `tl, tr, bl, br` | Integer | 四个光敏电阻的原始数值 |
| `power` | `voltage` | Float | 太阳能板实时电压 (V) |
| `power` | `current` | Float | 太阳能板实时电流 (A) |

## 🚀 进度更新
- [x] Firebase Realtime Database 环境搭建。
- [x] Python 自动化脚本编写 (实现 AI 决策逻辑)。
- [x] 实现 AI 故障自动切换机制 (API 报错时自动切换至模拟算法)。
- [x] 成功实现云端数据同步。

## ⚠️ 开发注意事项 (给队友的提示)
1. **认证**: 运行脚本前需准备 `serviceAccountKey.json`。
2. **ESP32 连接**: 请使用 `Firebase ESP Client` 库连接，Database URL 见控制台。
3. **频率**: 目前 Python 端的 AI 决策更新频率为 60 秒/次。
