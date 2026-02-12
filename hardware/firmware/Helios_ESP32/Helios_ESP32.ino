#include <WiFi.h>
#include <FirebaseESP32.h>
#include <ESP32Servo.h>
#include <DHT.h>

// --- Configuration ---
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase
#define FIREBASE_HOST "YOUR_PROJECT_ID.firebaseio.com" 
#define FIREBASE_AUTH "YOUR_FIREBASE_DATABASE_SECRET" 

// Pins
#define PIN_SERVO_H 13
#define PIN_SERVO_V 12
#define PIN_LDR_TL 34
#define PIN_LDR_TR 35
#define PIN_LDR_BL 32
#define PIN_LDR_BR 33
#define PIN_DHT 4
#define PIN_RAIN 14

// Sensor Objects
DHT dht(PIN_DHT, DHT11); // Change to DHT22 if using DHT22
Servo servoH;
Servo servoV;

// Firebase Objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// Variables
int angleH = 90;
int angleV = 45;
unsigned long lastSensorUpdate = 0;
const int UPDATE_INTERVAL = 5000; // 5 seconds

void setup() {
  Serial.begin(115200);

  // Initialize Sensors & Actuators
  dht.begin();
  pinMode(PIN_RAIN, INPUT);
  
  // Allocate timers for ESP32 PWM
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);
  
  servoH.setPeriodHertz(50);
  servoV.setPeriodHertz(50);
  servoH.attach(PIN_SERVO_H, 500, 2400); 
  servoV.attach(PIN_SERVO_V, 500, 2400);

  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());

  // Connect to Firebase
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  unsigned long currentMillis = millis();

  // --- 1. Safety Check (Immediate) ---
  // If Rain Sensor is triggered (Assuming LOW means Wet, check your sensor!)
  // Adjust logic: usually Digital Output is LOW when wet for these modules.
  int isRaining = digitalRead(PIN_RAIN); 
  bool safetyTriggered = (isRaining == LOW); 

  if (safetyTriggered) {
    Serial.println("🚨 RAIN DETECTED! Entering Safety Mode.");
    servoV.write(0); // Face Up
    // Optional: Write status to Firebase immediately if needed
    return; // SKIP the rest of the loop
  }

  // --- 2. Read Control Commands from Firebase ---
  if (Firebase.ready()) {
    if (Firebase.getInt(fbdo, "/control_commands/target_h")) {
      int targetH = fbdo.to<int>();
      servoH.write(targetH);
    }
    if (Firebase.getInt(fbdo, "/control_commands/target_v")) {
      int targetV = fbdo.to<int>();
      servoV.write(targetV);
    }
  }

  // --- 3. Upload Sensor Data (Interval) ---
  if (currentMillis - lastSensorUpdate > UPDATE_INTERVAL) {
    lastSensorUpdate = currentMillis;

    // Read Sensors
    float h = dht.readHumidity();
    float t = dht.readTemperature();
    int ldr_tl = analogRead(PIN_LDR_TL);
    int ldr_tr = analogRead(PIN_LDR_TR);
    int ldr_bl = analogRead(PIN_LDR_BL);
    int ldr_br = analogRead(PIN_LDR_BR);
    
    // Create JSON
    FirebaseJson json;
    json.set("humidity", h);
    json.set("temperature", t);
    json.set("rain_status", safetyTriggered);
    json.set("lux_tl", ldr_tl);
    json.set("lux_tr", ldr_tr);
    json.set("lux_bl", ldr_bl);
    json.set("lux_br", ldr_br);
    json.set("voltage", 12.0); // Placeholder or use voltage divider on ADC

    // Push to Firebase
    Serial.println("Sending sensor data...");
    if (Firebase.set(fbdo, "/sensor_data", json)) {
      Serial.println("✅ Data sent!");
    } else {
      Serial.print("❌ Send failed: ");
      Serial.println(fbdo.errorReason());
    }
  }
}
