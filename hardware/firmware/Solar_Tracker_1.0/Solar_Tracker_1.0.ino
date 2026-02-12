#define ENABLE_USER_AUTH
#define ENABLE_DATABASE

#include <Arduino.h>
#include <ArduinoJson.h>
#include <WiFiS3.h>
#include <WiFiSSLClient.h>
#include <FirebaseClient.h>
#include <Servo.h>

#define WIFI_SSID "WKC-time"
#define WIFI_PASSWORD "wkc0122876591"
#define DATABASE_URL "dualaxissolartracker-46ecc-default-rtdb.asia-southeast1.firebasedatabase.app"
#define Web_API_KEY "AIzaSyCvBimHDvLLCZ07f4ee0Ubl7fPyvTui0Ik"
#define USER_EMAIL "wongweixiang@graduate.utm.my"
#define USER_PASS "WeiXiang03"

WiFiSSLClient ssl_client;
AsyncClientClass aClient(ssl_client);
FirebaseApp app;
RealtimeDatabase Database;
UserAuth user_auth(Web_API_KEY, USER_EMAIL, USER_PASS);
AsyncResult result;

Servo h;
Servo v;
int servoH = 90;
int servoV = 0;
const int servoHLimitHigh = 180;
const int servoHLimitLow = 0;
const int servoVLimitHigh = 90;
const int servoVLimitLow = 0;
int ldrtl = 0;
int ldrtr = 1;
int ldrbl = 2;
int ldrbr = 3; 
int tl, tr, bl, br, tol, dtime;
bool isRaining = false;
int pinRain = 7;               //rain detector
int manualMode = 0;            // 0 = Auto, 1 = Manual
int manualH = 90;
int manualV = 0;
unsigned long lastUpload = 0;
unsigned long lastDownload = 0;
unsigned long lastWiFiCheck = 0;
const unsigned long UploadInterval = 60000;   // 1 minute
const unsigned long DownloadInterval = 10000; // 10 seconds
const unsigned long WifiRetryInterval = 20000; // 30 seconds

void checkWiFi();
void uploadData();
void readManualCommand();
void SolarTracker();
void AutoTracking();
void setup() {
  Serial.begin(115200);
  h.attach(9); 
  v.attach(10);
  h.write(servoH);
  v.write(servoV);
  pinMode(pinRain, INPUT_PULLUP);
  pinMode(LED_BUILTIN, OUTPUT);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  initializeApp(aClient, app, getAuth(user_auth));
  app.getApp<RealtimeDatabase>(Database);
  Database.url(DATABASE_URL);
}

void loop() {
  tl = analogRead(ldrtl); 
  tr = analogRead(ldrtr);
  bl = analogRead(ldrbl); 
  br = analogRead(ldrbr);
  dtime = analogRead(4)/10; //delay potentiometer
  tol = analogRead(5)/4;     //tolerance potentiometer
  isRaining = (digitalRead(pinRain) == LOW);
  SolarTracker();
  checkWiFi();
  if (WiFi.status() == WL_CONNECTED) {
    app.loop();
    uploadData();
    readManualCommand();
  }
}
void SolarTracker(){
  if (isRaining) {
    Serial.println("RAIN DETECTED");
    servoV = 0;
    v.write(servoV);
  }
  else if (manualMode == 1) {
    digitalWrite(LED_BUILTIN, HIGH);
    h.write(manualH);
    v.write(manualV);
    servoH = manualH;
    servoV = manualV;
  }
  else {
    digitalWrite(LED_BUILTIN, LOW);
    AutoTracking();
  }
}

void AutoTracking() {
  int avt = (tl + tr) / 2; // Average Top
  int avd = (bl + br) / 2; // Average Bottom
  int avl = (tl + bl) / 2; // Average Left
  int avr = (tr + br) / 2; // Average Right
  int dvert = avt - avd;  // Vertical difference
  int dhoriz = avl - avr; // Horizontal difference
  bool moved = false;
  // Vertical
    if (abs(dvert) > tol) {
      if (avt > avd) {
        servoV = ++servoV;
        if (servoV > servoVLimitHigh) servoV = servoVLimitHigh;
      } else if (avt < avd) {
        servoV = --servoV;
        if (servoV < servoVLimitLow) servoV = servoVLimitLow;
      }
      v.write(servoV);
      moved = true;
    }
  // Horizontal
    if (abs(dhoriz) > tol) {
     if (avl > avr) {
        servoH = --servoH; // Swap -- and ++ if direction is inverted
        if (servoH < servoHLimitLow) servoH = servoHLimitLow;
      } else if (avl < avr) {
        servoH = ++servoH;
        if (servoH > servoHLimitHigh) servoH = servoHLimitHigh;
      }
      h.write(servoH); 
      moved = true;
    } 
    if (moved) { 
      delay(dtime);
    }
}


void checkWiFi() {
  if (millis() - lastWiFiCheck > WifiRetryInterval) {
    lastWiFiCheck = millis();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("Reconnecting WiFi...");
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    }
  }
}

void uploadData(){
  if (WiFi.status() != WL_CONNECTED) return;
  if (millis() - lastUpload > UploadInterval) {
    lastUpload = millis()
    ;
    String rainVal = isRaining ? "RAIN" : "CLEAR";
    String modeVal = (manualMode == 1) ? "MANUAL" : "AUTO";
    String allData = rainVal + ", " +
                     modeVal + ", " +
                     String(tl) + ", " + 
                     String(tr) + ", " + 
                     String(bl) + ", " + 
                     String(br) + ", " + 
                     String(servoH) + ", " + 
                     String(servoV);
    Serial.print("Sending Data: ");
    Serial.println(allData);
    Database.set(aClient, "/tracker_status/all_data", allData, result);
  }
}

void readManualCommand() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (millis() - lastDownload > DownloadInterval) {
    lastDownload = millis();

    Database.get(aClient, "/control_commands", result);
    if(result.available()) { 
      String jsonPayload = result.payload();
      StaticJsonDocument<200> doc;
      DeserializationError error = deserializeJson(doc, jsonPayload);
      if (error) {
        Serial.print("JSON Parse Failed: ");
        Serial.println(error.f_str());
        return;
      }
      if (doc.containsKey("manual_mode")) {
        manualMode = doc["manual_mode"];
      }
      if (manualMode == 1) {
        if (doc.containsKey("target_h")) manualH = doc["target_h"];
        if (doc.containsKey("target_v")) manualV = doc["target_v"];
        
        Serial.print("Manual Mode - H:"); Serial.print(manualH);
        Serial.print(" V:"); Serial.println(manualV);
      } else {
        Serial.println("Auto Mode");
      }
    }else {
      Serial.println("Firebase get failed or timed out.");
    }
  }
}

void printError(AsyncResult &aResult) {
  if (aResult.isError()) {
    Serial.print("Error: ");
    Serial.println(aResult.c_str());
  }
}
