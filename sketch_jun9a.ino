#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

// WiFi & Server Configuration
const char* ssid = "YOUR_SSID"; 
const char* password = "YOUR_PASSWORD"; 

const char* dataServer = "http://<YOUR_PC_IP>:3000/log";// Replace with your PC IP
const char* locationServer = "http://<YOUR_PC_IP>:3000/current-location";  // Replace with your PC IP

// Pin Definitions
#define LED_BUILTIN_PIN 2
#define buz D1 //It's a green led that blinks when the data is send to the local server. 
              //if it stay lighted without blinking then it means the server is not started/ node mcu is not sending data to the server.

// 7-segment pins for common anode (a-g)
const int segmentPins[7] = {D5, D6, D7, D8, D0, D4, D3};
const int digitPins[1] = {D2}; // Single digit

// Segment patterns (0 = ON for common anode)
const byte digitCodes[10][7] = {
  {0,0,0,0,0,0,1}, // 0
  {1,0,0,1,1,1,1}, // 1
  {0,0,1,0,0,1,0}, // 2
  {0,0,0,0,1,1,0}, // 3
  {1,0,0,1,1,0,0}, // 4
  {0,1,0,0,1,0,0}, // 5
  {0,1,0,0,0,0,0}, // 6
  {0,0,0,1,1,1,1}, // 7
  {0,0,0,0,0,0,0}, // 8
  {0,0,0,0,1,0,0}  // 9
};

int rssiValue = 0;
unsigned long lastPostTime = 0;
unsigned long lastDisplayRefresh = 0;
unsigned long lastSecondTick = 0;
int countdown = 10;  // Starts at 10 and counts down to 0

bool buzzerActive = false;
String location = "Lab1"; // Default fallback

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  pinMode(LED_BUILTIN_PIN, OUTPUT);
  pinMode(buz, OUTPUT);

  for (int i = 0; i < 7; i++) {
    pinMode(segmentPins[i], OUTPUT);
    digitalWrite(segmentPins[i], HIGH); // OFF for common anode
  }
  pinMode(digitPins[0], OUTPUT);
  digitalWrite(digitPins[0], HIGH); // Digit off

  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");

  digitalWrite(buz, HIGH);
  delay(1000);
  digitalWrite(buz, LOW);

  lastPostTime = millis();
  lastSecondTick = millis();
}

void loop() {
  unsigned long currentMillis = millis();

  // Countdown logic: update every 1 sec
  if (currentMillis - lastSecondTick >= 1000) {
    lastSecondTick = currentMillis;
    if (countdown > 0) countdown--;
  }

  // Refresh display every 5 ms
  if (currentMillis - lastDisplayRefresh >= 5) {
    lastDisplayRefresh = currentMillis;
    displaySingleDigit(countdown);
  }

  // Send data every 10 seconds
  if (WiFi.status() == WL_CONNECTED && currentMillis - lastPostTime >= 10000) {
    lastPostTime = currentMillis;
    countdown = 10;  // Reset countdown

    rssiValue = abs(WiFi.RSSI());
    location = fetchLocation();  // Get latest location from server

    WiFiClient client;
    HTTPClient http;

    String json = "{\"ssid\":\"" + WiFi.SSID() +
                  "\",\"rssi\":\"" + String(WiFi.RSSI()) +
                  "\",\"location\":\"" + location + "\"}";

    http.begin(client, dataServer);
    http.addHeader("Content-Type", "application/json");
    int httpCode = http.POST(json);
    Serial.print("Data POST Response: ");
    Serial.println(httpCode);
    http.end();

    if (httpCode > 0) {
      digitalWrite(buz, LOW);
      buzzerActive = false;

      digitalWrite(LED_BUILTIN_PIN, LOW);
      digitalWrite(buz, HIGH);
      delay(100);
      digitalWrite(LED_BUILTIN_PIN, HIGH);
      digitalWrite(buz, LOW);
    } else if (httpCode == -1) {
      digitalWrite(buz, HIGH);
      buzzerActive = true;
    }
  }
}

void displaySingleDigit(int number) {
  number = constrain(number, 0, 9); // Ensure valid range
  digitalWrite(digitPins[0], LOW); // Enable digit
  for (int i = 0; i < 7; i++) {
    digitalWrite(segmentPins[i], digitCodes[number][i] ? HIGH : LOW);
  }
  delay(1);
  digitalWrite(digitPins[0], HIGH); // Disable digit
}

String fetchLocation() {
  WiFiClient client;
  HTTPClient http;

  http.begin(client, locationServer); // GET location
  int httpCode = http.GET();
  String location = "Lab1";

  if (httpCode == 200) {
    location = http.getString();
    location.trim();
    location.replace("\"", "");
    Serial.print("Fetched Location: ");
    Serial.println(location);
  } else {
    Serial.println("Failed to fetch location");
  }

  http.end();
  return location;
}