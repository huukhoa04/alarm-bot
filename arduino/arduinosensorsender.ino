#include <SoftwareSerial.h>
#include <DHT.h>
#include <ArduinoJson.h>

// Định nghĩa chân
#define DHTPIN 2       // DHT22 nối chân D2
#define DHTTYPE DHT22
#define FIRE_SENSOR 3  // Cảm biến lửa nối D3
#define GAS_SENSOR 4   // Cảm biến khí gas nối D4
#define ANALOG_1 A0
#define ANALOG_2 A1

// Khởi tạo đối tượng
DHT dht(DHTPIN, DHTTYPE);
// Chỉ cần TX để gửi cho ESP32, kết nối TX Arduino -> RX ESP32 (GPIO3)
SoftwareSerial espSerial(5, 6); // TX = D5 (gửi tới ESP32 GPIO3), RX = D6 (không dùng)

// Hàm khởi động
void setup() {
  Serial.begin(9600);
  espSerial.begin(9600);
  dht.begin();

  pinMode(FIRE_SENSOR, INPUT);
  pinMode(GAS_SENSOR, INPUT);

  Serial.println("Arduino: Bắt đầu gửi dữ liệu JSON cho ESP32...");
  Serial.println("Kết nối: Arduino D5 (TX) -> ESP32 GPIO3 (RX)");
}

// Hàm lặp
void loop() {
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  int fire = digitalRead(FIRE_SENSOR);
  int gas = digitalRead(GAS_SENSOR);
  int analog1 = analogRead(ANALOG_1);
  int analog2 = analogRead(ANALOG_2);

  // Kiểm tra dữ liệu DHT
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Lỗi đọc cảm biến DHT22!");
    return;
  }

  // Tạo JSON string
  StaticJsonDocument<200> jsonDoc;
  jsonDoc["temperature"] = temperature;
  jsonDoc["humidity"] = humidity;
  jsonDoc["fire"] = fire;
  jsonDoc["gas"] = gas;
  jsonDoc["analog1"] = analog1;
  jsonDoc["analog2"] = analog2;

  String output;
  serializeJson(jsonDoc, output);

  // Gửi dữ liệu qua Serial Monitor (debug)
  Serial.println("Arduino gửi: " + output);
  
  // Gửi dữ liệu cho ESP32 qua SoftwareSerial
  espSerial.println(output);
  espSerial.flush(); // Đảm bảo dữ liệu được gửi hoàn toàn

  delay(2000); // Gửi mỗi 2 giây
}
