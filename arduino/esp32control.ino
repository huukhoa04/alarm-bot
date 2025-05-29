#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include "esp_camera.h"
#include "esp_timer.h"
#include "esp_log.h"

// Thông tin WiFi
const char* ssid = "Thu Nam";        
const char* password = "thunam12345"; 

// Tạo web server và WebSocket server
WebServer server(3333);
WebSocketsServer webSocket(4444);
WebServer cameraServer(5555);  // Server riêng cho camera stream

// Socket server thông thường cho Python
WiFiServer socketServer(8080);
WiFiClient currentClient;

// Web server cho serial logging tại port 8083
WebServer serialLogServer(8083);
WebSocketsServer serialLogWebSocket(8084);

// Serial log buffer
#define SERIAL_LOG_BUFFER_SIZE 50
String serialLogBuffer[SERIAL_LOG_BUFFER_SIZE];
int serialLogIndex = 0;
bool serialLogFull = false;

// Arduino Sensor Data Structure
struct ArduinoSensorData {
  float temperature;
  float humidity;
  int fire;
  int gas;
  int analog1;
  int analog2;
  bool dataValid;
  unsigned long lastUpdate;
  String rawJson;
};

ArduinoSensorData sensorData = {0.0, 0.0, 0, 0, 0, 0, false, 0, ""};

// Thêm HardwareSerial cho Arduino communication
HardwareSerial arduinoSerial(1); // UART1 thay vì Serial2

// Camera configuration cho AI Thinker ESP32-CAM
#define CAMERA_MODEL_AI_THINKER
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// Khai báo chân điều khiển động cơ
const int IN1 = 14;
const int IN2 = 15;
const int IN3 = 13;
const int IN4 = 12;
const int ENA = 4;
const int ENB = 2;

// PWM Channels cho motor (tránh xung đột với camera)
#define MOTOR_PWM_CHANNEL_A 2
#define MOTOR_PWM_CHANNEL_B 3
#define MOTOR_PWM_FREQ 1000
#define MOTOR_PWM_RESOLUTION 8

// Tốc độ động cơ
int TOC_DO = 150;

// Timeout cho kết nối (ms)
unsigned long lastCommandTime = 0;
const unsigned long TIMEOUT_MS = 3000;

// Biến trạng thái robot
String currentStatus = "stopped";
String lastCommand = "";
int batteryLevel = 100;
unsigned long statusUpdateTime = 0;
const unsigned long STATUS_UPDATE_INTERVAL = 3000;

// Rate limiting cho commands
unsigned long lastWebSocketCommand = 0;
const unsigned long WEBSOCKET_COMMAND_INTERVAL = 50;  // Giảm từ 200ms xuống 50ms để responsive hơn

// Watchdog và stability
unsigned long lastWatchdog = 0;
const unsigned long WATCHDOG_INTERVAL = 1000;
bool motorEnabled = true;
bool cameraEnabled = false;

// FreeRTOS Task handles
TaskHandle_t motorTaskHandle = NULL;
TaskHandle_t cameraTaskHandle = NULL;
TaskHandle_t websocketTaskHandle = NULL;
TaskHandle_t arduinoTaskHandle = NULL;

// Mutex cho shared resources
SemaphoreHandle_t motorMutex;
SemaphoreHandle_t statusMutex;
SemaphoreHandle_t sensorMutex;
SemaphoreHandle_t cameraMutex;  // Thêm mutex cho camera

// Queue cho motor commands
QueueHandle_t motorCommandQueue;

// Struct cho motor commands
struct MotorCommand {
  char command;
  int speed;
  unsigned long timestamp;
};

void setup() {
  Serial.begin(115200);
  arduinoSerial.begin(9600, SERIAL_8N1, 3, -1);  // UART1 để nhận từ Arduino (RX=3, TX=disabled)
  Serial.println("ESP32 Robot Controller with Camera and Arduino Sensor Starting...");
  
  // Test Arduino Serial configuration
  Serial.println("🔧 Testing Arduino Serial configuration...");
  Serial.printf("Arduino Serial RX Pin: %d (GPIO3)\n", 3);
  Serial.printf("Arduino Serial TX Pin: %d (disabled)\n", -1);
  Serial.printf("Arduino Serial Baud Rate: %d\n", 9600);
  Serial.println("📡 Waiting for Arduino data on GPIO3...");
  
  // Tạo mutex và queue
  motorMutex = xSemaphoreCreateMutex();
  statusMutex = xSemaphoreCreateMutex();
  sensorMutex = xSemaphoreCreateMutex();
  cameraMutex = xSemaphoreCreateMutex();
  motorCommandQueue = xQueueCreate(10, sizeof(MotorCommand));
  
  // Kiểm tra mutex creation
  if (!motorMutex || !statusMutex || !sensorMutex || !motorCommandQueue || !cameraMutex) {
    Serial.println("ERROR: Failed to create mutex or queue");
    return;
  }
  
  // Cấu hình GPIO motor
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);

  // Cấu hình PWM
  if (!ledcAttachChannel(ENA, MOTOR_PWM_FREQ, MOTOR_PWM_RESOLUTION, MOTOR_PWM_CHANNEL_A)) {
    Serial.println("ERROR: Failed to attach ENA PWM");
    motorEnabled = false;
  }
  if (!ledcAttachChannel(ENB, MOTOR_PWM_FREQ, MOTOR_PWM_RESOLUTION, MOTOR_PWM_CHANNEL_B)) {
    Serial.println("ERROR: Failed to attach ENB PWM");
    motorEnabled = false;
  }
  
  ledcWrite(ENA, 0);
  ledcWrite(ENB, 0);

  // Khởi tạo camera
  initCamera();

  // Kết nối WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  int wifiTimeout = 0;
  while (WiFi.status() != WL_CONNECTED && wifiTimeout < 20) {
    delay(500);
    Serial.print(".");
    wifiTimeout++;
  }
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nWiFi connection failed!");
    return;
  }
  
  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  // Khởi động servers
  server.on("/", handleRoot);
  server.begin();
  Serial.print("Web server: http://");
  Serial.println(WiFi.localIP());
  
  // Camera server
  cameraServer.on("/stream", HTTP_GET, handleCameraStream);
  cameraServer.begin();
  Serial.print("Camera server: http://");
  Serial.print(WiFi.localIP());
  Serial.println(":5555/stream");
  
  // WebSocket server
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.print("WebSocket server: ws://");
  Serial.print(WiFi.localIP());
  Serial.println(":4444");
  
  // Serial Log Web Server
  serialLogServer.on("/", handleSerialLogRoot);
  serialLogServer.on("/logs", handleSerialLogs);
  serialLogServer.on("/clear", handleClearLogs);
  serialLogServer.begin();
  Serial.print("Serial Log server: http://");
  Serial.print(WiFi.localIP());
  Serial.println(":3333");
  
  // Serial Log WebSocket server
  serialLogWebSocket.begin();
  serialLogWebSocket.onEvent(serialLogWebSocketEvent);
  Serial.print("Serial Log WebSocket: ws://");
  Serial.print(WiFi.localIP());
  Serial.println(":8084");
  
  // Socket server cho Python
  socketServer.begin();
  Serial.print("Socket server: ");
  Serial.print(WiFi.localIP());
  Serial.println(":8080");
  
  dungLai();
  lastCommandTime = millis();
  statusUpdateTime = millis();
  lastWatchdog = millis();
  
  // Tạo FreeRTOS tasks
  xTaskCreatePinnedToCore(
    motorTask,           // Task function
    "MotorTask",         // Task name
    4096,                // Stack size
    NULL,                // Parameters
    2,                   // Priority
    &motorTaskHandle,    // Task handle
    0                    // Core 0
  );
  
  xTaskCreatePinnedToCore(
    cameraTask,          // Task function
    "CameraTask",        // Task name
    8192,                // Stack size
    NULL,                // Parameters
    1,                   // Priority
    &cameraTaskHandle,   // Task handle
    1                    // Core 1
  );
  
  xTaskCreatePinnedToCore(
    websocketTask,       // Task function
    "WebSocketTask",     // Task name
    4096,                // Stack size
    NULL,                // Parameters
    2,                   // Priority
    &websocketTaskHandle, // Task handle
    0                    // Core 0
  );
  
  BaseType_t result4 = xTaskCreatePinnedToCore(
    arduinoSensorTask,   // Task function
    "ArduinoSensorTask", // Task name
    4096,                // Stack size
    NULL,                // Parameters
    1,                   // Priority
    &arduinoTaskHandle,  // Task handle
    0                    // Core 0
  );
  
  // Kiểm tra task creation
  if (result4 != pdPASS) {
    Serial.println("ERROR: Failed to create Arduino sensor task");
    return;
  }
  
  Serial.println("Setup completed successfully!");
  Serial.println("Tasks created on both cores for parallel processing");
  Serial.println("Arduino Sensor monitoring started on UART1 (RX=3, TX=disabled, 9600 baud)");
  Serial.println("🔌 Connect Arduino D5 (TX) to ESP32 GPIO3 (RX)");
  
  // Initialize serial logging
  addToSerialLog("ESP32 Robot Controller with Camera and Arduino Sensor Starting...");
  addToSerialLog("Setup completed successfully!");
  addToSerialLog("Tasks created on both cores for parallel processing");
  addToSerialLog("Arduino Sensor monitoring started on UART1 (RX=3, TX=disabled, 9600 baud)");
}

void loop() {
  // Main loop chỉ xử lý web server và watchdog
  server.handleClient();
  cameraServer.handleClient();
  serialLogServer.handleClient();
  
  // Watchdog
  if (millis() - lastWatchdog > WATCHDOG_INTERVAL) {
    yield();
    lastWatchdog = millis();
  }
  
  // Kiểm tra timeout
  if (millis() - lastCommandTime > TIMEOUT_MS) {
    if (currentStatus != "stopped") {
      Serial.println("Command timeout - stopping robot");
      MotorCommand stopCmd = {'x', 0, millis()};
      xQueueSend(motorCommandQueue, &stopCmd, 0);
      lastCommandTime = millis();
    }
  }
  
  delay(20);
}

// Task xử lý motor trên Core 0
void motorTask(void *parameter) {
  MotorCommand cmd;
  
  while (true) {
    // Chờ lệnh từ queue với timeout ngắn để responsive hơn
    if (xQueueReceive(motorCommandQueue, &cmd, 10 / portTICK_PERIOD_MS)) {
      if (xSemaphoreTake(motorMutex, 50 / portTICK_PERIOD_MS)) {
        executeMotorCommand(cmd.command, cmd.speed);
        xSemaphoreGive(motorMutex);
      }
    }
    // Giảm delay để task responsive hơn
    vTaskDelay(5 / portTICK_PERIOD_MS);
  }
}

// Task xử lý camera stream trên Core 1
void cameraTask(void *parameter) {
  while (true) {
    if (cameraEnabled) {
      // Camera stream được xử lý trong handleCameraStream
      // Task này chỉ để maintain camera system
      vTaskDelay(100 / portTICK_PERIOD_MS);
    } else {
      vTaskDelay(1000 / portTICK_PERIOD_MS);
    }
  }
}

// Task xử lý WebSocket trên Core 0
void websocketTask(void *parameter) {
  while (true) {
    webSocket.loop();
    serialLogWebSocket.loop();
    handleSocketServer();
    
    // Gửi status update định kỳ
    if (millis() - statusUpdateTime > STATUS_UPDATE_INTERVAL) {
      sendStatusUpdate();
      statusUpdateTime = millis();
    }
    
    vTaskDelay(50 / portTICK_PERIOD_MS);
  }
}

void initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_1;  // Sử dụng timer 1 thay vì timer 0
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 10000000;  // Giảm từ 20MHz xuống 10MHz để ổn định hơn
  config.pixel_format = PIXFORMAT_JPEG;
  
  // Cấu hình tối ưu cho dual operation
  if(psramFound()){
    config.frame_size = FRAMESIZE_VGA;  // VGA thay vì UXGA
    config.jpeg_quality = 12;           // Quality trung bình
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_QVGA; // QVGA cho no-PSRAM
    config.jpeg_quality = 15;
    config.fb_count = 1;
  }

  // Khởi tạo camera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\n", err);
    cameraEnabled = false;
    return;
  }
  
  // Cấu hình sensor tối ưu
  sensor_t * s = esp_camera_sensor_get();
  if (s->id.PID == OV3660_PID) {
    s->set_vflip(s, 1);
    s->set_brightness(s, 1);
    s->set_saturation(s, -2);
  }
  
  // Tối ưu cho dual operation
  s->set_framesize(s, FRAMESIZE_QVGA);  // QVGA cho tốc độ cao
  s->set_quality(s, 12);                // Quality vừa phải
  s->set_ae_level(s, 0);                // Auto exposure
  s->set_gainceiling(s, (gainceiling_t)6); // Gain ceiling
  
  cameraEnabled = true;
  Serial.println("Camera initialized for dual motor+stream operation");
}

void handleRoot() {
  String html = "<!DOCTYPE html><html><head><title>ESP32 Robot Controller</title></head>";
  html += "<body><h1>ESP32 Robot Controller</h1>";
  html += "<p>WebSocket: ws://" + WiFi.localIP().toString() + ":4444</p>";
  html += "<p>Camera Stream: http://" + WiFi.localIP().toString() + ":5555/stream</p>";
  html += "<p>Socket Server: " + WiFi.localIP().toString() + ":8080</p>";
  html += "<p><strong>🔍 Serial Logger: <a href=\"http://" + WiFi.localIP().toString() + ":8083\" target=\"_blank\">http://" + WiFi.localIP().toString() + ":8083</a></strong></p>";
  html += "<hr>";
  html += "<h2>🤖 Robot Status</h2>";
  html += "<p>Status: " + currentStatus + "</p>";
  html += "<p>Speed: " + String(TOC_DO) + "</p>";
  html += "<p>Battery: " + String(batteryLevel) + "%</p>";
  html += "<hr>";
  html += "<h2>📊 Arduino Sensor Data</h2>";
  
  if (xSemaphoreTake(sensorMutex, 100 / portTICK_PERIOD_MS)) {
    if (sensorData.dataValid) {
      html += "<p>🌡️ Temperature: " + String(sensorData.temperature, 1) + "°C</p>";
      html += "<p>💧 Humidity: " + String(sensorData.humidity, 1) + "%</p>";
      html += "<p>🔥 Fire Sensor: " + String(sensorData.fire) + "</p>";
      html += "<p>🛢️ Gas Sensor: " + String(sensorData.gas) + "</p>";
      html += "<p>📈 Analog 1: " + String(sensorData.analog1) + "</p>";
      html += "<p>📈 Analog 2: " + String(sensorData.analog2) + "</p>";
      html += "<p>⏱️ Last Update: " + String((millis() - sensorData.lastUpdate) / 1000) + " seconds ago</p>";
    } else {
      html += "<p>❌ No sensor data available</p>";
    }
    xSemaphoreGive(sensorMutex);
  } else {
    html += "<p>⚠️ Unable to access sensor data</p>";
  }
  
  html += "<hr>";
  html += "<h2>📡 Socket Commands</h2>";
  html += "<p><strong>Motor Control:</strong> COMMAND:w/s/a/d/x</p>";
  html += "<p><strong>Speed Control:</strong> SPEED:50-150</p>";
  html += "<p><strong>Status:</strong> STATUS</p>";
  html += "<p><strong>Sensor Data:</strong> SENSOR_DATA</p>";
  html += "<p><strong>Sensor Status:</strong> SENSOR_STATUS</p>";
  html += "<p><strong>Ping:</strong> PING</p>";
  html += "</body></html>";
  
  server.send(200, "text/html", html);
}

void handleCameraStream() {
  if (!cameraEnabled) {
    cameraServer.send(503, "text/plain", "Camera not available");
    return;
  }
  
  // Sử dụng timeout ngắn hơn cho camera mutex
  if (!xSemaphoreTake(cameraMutex, 100 / portTICK_PERIOD_MS)) {
    cameraServer.send(503, "text/plain", "Camera busy");
    return;
  }
  
  WiFiClient client = cameraServer.client();
  
  // HTTP headers cho MJPEG stream
  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: multipart/x-mixed-replace; boundary=frame");
  client.println("Cache-Control: no-cache");
  client.println("Connection: keep-alive");
  client.println("Access-Control-Allow-Origin: *");
  client.println();
  
  unsigned long lastFrameTime = 0;
  const unsigned long frameInterval = 100; // Tăng FPS lên ~10 FPS
  unsigned long streamStartTime = millis();
  
  while (client.connected()) {
    // Giới hạn thời gian stream liên tục để không block motor
    if (millis() - streamStartTime > 5000) {
      // Sau 5 giây, nghỉ 50ms để motor có cơ hội chạy
      xSemaphoreGive(cameraMutex);
      vTaskDelay(50 / portTICK_PERIOD_MS);
      if (!xSemaphoreTake(cameraMutex, 100 / portTICK_PERIOD_MS)) {
        break; // Nếu không lấy được mutex, thoát
      }
      streamStartTime = millis();
    }
    
    // Throttle frame rate
    if (millis() - lastFrameTime < frameInterval) {
      vTaskDelay(5 / portTICK_PERIOD_MS); // Giảm delay
      continue;
    }
    
    camera_fb_t * fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("Camera capture failed");
      vTaskDelay(10 / portTICK_PERIOD_MS);
      continue; // Thử lại thay vì break
    }
    
    // Gửi frame header
    client.println("--frame");
    client.println("Content-Type: image/jpeg");
    client.printf("Content-Length: %u\r\n\r\n", fb->len);
    
    // Gửi image data với timeout
    size_t written = 0;
    if (client.connected()) {
      written = client.write(fb->buf, fb->len);
      client.println();
    }
    
    esp_camera_fb_return(fb);
    lastFrameTime = millis();
    
    // Kiểm tra kết nối và lỗi ghi
    if (!client.connected() || (written > 0 && written != fb->len)) {
      break;
    }
    
    // Yield ngắn để các task khác chạy
    vTaskDelay(2 / portTICK_PERIOD_MS);
  }
  
  client.stop();
  xSemaphoreGive(cameraMutex);
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("WebSocket [%u] Disconnected!\n", num);
      {
        MotorCommand stopCmd = {'x', 0, millis()};
        xQueueSend(motorCommandQueue, &stopCmd, 0);
      }
      break;
      
    case WStype_CONNECTED:
      {
        IPAddress ip = webSocket.remoteIP(num);
        Serial.printf("WebSocket [%u] Connected from %d.%d.%d.%d\n", num, ip[0], ip[1], ip[2], ip[3]);
        addToSerialLog("WebSocket [" + String(num) + "] Connected from " + ip.toString());
        
        webSocket.sendTXT(num, "CONNECTED:ESP32 Robot Controller Ready");
        webSocket.sendTXT(num, "STATUS:" + currentStatus);
        webSocket.sendTXT(num, "SPEED:" + String(TOC_DO));
        webSocket.sendTXT(num, "CAMERA:http://" + WiFi.localIP().toString() + ":5555/stream");
        
        if (!motorEnabled) {
          webSocket.sendTXT(num, "ERROR:Motor PWM initialization failed");
        }
        if (!cameraEnabled) {
          webSocket.sendTXT(num, "ERROR:Camera initialization failed");
        }
      }
      break;
      
    case WStype_TEXT:
      {
        String message = String((char*)payload);
        
        if (millis() - lastWebSocketCommand < WEBSOCKET_COMMAND_INTERVAL) {
          Serial.println("Rate limited: " + message);
          addToSerialLog("Rate limited: " + message);
          return;
        }
        lastWebSocketCommand = millis();
        
        Serial.printf("WebSocket [%u] Received: %s\n", num, message.c_str());
        addToSerialLog("WebSocket [" + String(num) + "] Received: " + message);
        
        String response = processCommand(message);
        if (response.length() > 0) {
          webSocket.sendTXT(num, response);
          addToSerialLog("WebSocket [" + String(num) + "] Response: " + response);
        }
        
        lastCommandTime = millis();
      }
      break;
      
    default:
      break;
  }
}

void handleSocketServer() {
  if (!currentClient || !currentClient.connected()) {
    if (currentClient) {
      currentClient.stop();
      Serial.println("Socket client disconnected");
      MotorCommand stopCmd = {'x', 0, millis()};
      xQueueSend(motorCommandQueue, &stopCmd, 0);
    }
    
    currentClient = socketServer.available();
    if (currentClient) {
      Serial.println("New socket client connected");
      sendSocketMessage("CONNECTED:ESP32 Robot Controller Ready");
      sendSocketMessage("STATUS:" + currentStatus);
      sendSocketMessage("SPEED:" + String(TOC_DO));
      sendSocketMessage("CAMERA:http://" + WiFi.localIP().toString() + ":5555/stream");
      lastCommandTime = millis();
    }
  }
  
  if (currentClient && currentClient.connected() && currentClient.available()) {
    String message = currentClient.readStringUntil('\n');
    message.trim();
    
    if (message.length() > 0) {
      Serial.println("Socket received: " + message);
      String response = processCommand(message);
      if (response.length() > 0) {
        sendSocketMessage(response);
      }
      lastCommandTime = millis();
    }
  }
}

String processCommand(String message) {
  if (message.startsWith("COMMAND:")) {
    String command = message.substring(8);
    return handleCommand(command);
  }
  else if (message.startsWith("SPEED:")) {
    String speedStr = message.substring(6);
    return handleSpeedChange(speedStr.toInt());
  }
  else if (message.startsWith("STATUS")) {
    return "STATUS:" + currentStatus;
  }
  else if (message.startsWith("PING")) {
    return "PONG:OK";
  }
  else if (message.startsWith("SENSOR_DATA")) {
    return handleSensorDataRequest();
  }
  else if (message.startsWith("SENSOR_STATUS")) {
    return handleSensorStatusRequest();
  }
  else if (message == "GET_SENSOR_DATA") {
    return handleSensorDataRequest();
  }
  else if (message == "GET_ALL_SENSORS") {
    return handleAllSensorsRequest();
  }
  else if (message == "GET_TEMPERATURE") {
    return handleTemperatureRequest();
  }
  else if (message == "GET_HUMIDITY") {
    return handleHumidityRequest();
  }
  else if (message == "GET_FIRE") {
    return handleFireRequest();
  }
  else if (message == "GET_GAS") {
    return handleGasRequest();
  }
  else if (message == "GET_ANALOG") {
    return handleAnalogRequest();
  }
  else if (message == "GET_STATUS") {
    return handleSensorStatusRequest();
  }
  else if (message == "HELP") {
    return handleHelpRequest();
  }
  else if (message.length() == 1) {
    return handleCommand(message);
  }
  
  return "ERROR:Unknown message format";
}

String handleCommand(String command) {
  if (!motorEnabled) {
    return "ERROR:Motor system disabled";
  }
  
  Serial.println("Executing command: " + command);
  
  // Gửi lệnh vào queue để xử lý bởi motor task
  MotorCommand cmd;
  cmd.command = command.charAt(0);
  cmd.speed = TOC_DO;
  cmd.timestamp = millis();
  
  if (xQueueSend(motorCommandQueue, &cmd, 100 / portTICK_PERIOD_MS) == pdTRUE) {
    if (command == "w") {
      return "RESPONSE:Moving forward";
    }
    else if (command == "s") {
      return "RESPONSE:Moving backward";
    }
    else if (command == "a") {
      return "RESPONSE:Turning left";
    }
    else if (command == "d") {
      return "RESPONSE:Turning right";
    }
    else if (command == "x") {
      return "RESPONSE:Stopped";
    }
  }
  
  return "ERROR:Unknown command";
}

void executeMotorCommand(char command, int speed) {
  if (!motorEnabled) return;
  
  switch(command) {
    case 'w':
      tien();
      break;
    case 's':
      lui();
      break;
    case 'a':
      reTrai();
      break;
    case 'd':
      rePhai();
      break;
    case 'x':
      dungLai();
      break;
    default:
      logMessage("Unknown motor command: " + String(command));
      break;
  }
}

String handleSpeedChange(int newSpeed) {
  if (newSpeed >= 50 && newSpeed <= 150) {
    TOC_DO = newSpeed;
    Serial.println("Speed changed to: " + String(newSpeed));
    return "RESPONSE:Speed updated to " + String(newSpeed);
  }
  return "ERROR:Invalid speed value (50-150)";
}

void sendSocketMessage(String message) {
  if (currentClient && currentClient.connected()) {
    currentClient.println(message);
    currentClient.flush();
  }
}

void sendStatusUpdate() {
  if (xSemaphoreTake(statusMutex, 100 / portTICK_PERIOD_MS)) {
    if (batteryLevel > 0) {
      batteryLevel--;
      if (batteryLevel <= 0) batteryLevel = 100;
    }
    
    String statusMsg = "STATUS:" + currentStatus;
    String batteryMsg = "BATTERY:" + String(batteryLevel);
    String uptimeMsg = "UPTIME:" + String(millis() / 1000);
    
    // Thêm sensor status
    String sensorStatusMsg = "SENSOR_STATUS_UPDATE:";
    if (xSemaphoreTake(sensorMutex, 50 / portTICK_PERIOD_MS)) {
      sensorStatusMsg += "valid:" + String(sensorData.dataValid ? "true" : "false");
      if (sensorData.dataValid) {
        sensorStatusMsg += ",last_sensor:" + String((millis() - sensorData.lastUpdate) / 1000) + "s_ago";
        sensorStatusMsg += ",temp:" + String(sensorData.temperature, 1);
        sensorStatusMsg += ",humidity:" + String(sensorData.humidity, 1);
      }
      xSemaphoreGive(sensorMutex);
    } else {
      sensorStatusMsg += "valid:false,error:mutex_timeout";
    }
    
    if (webSocket.connectedClients() > 0) {
      webSocket.broadcastTXT(statusMsg);
      webSocket.broadcastTXT(batteryMsg);
      webSocket.broadcastTXT(uptimeMsg);
      webSocket.broadcastTXT(sensorStatusMsg);
    }
    
    sendSocketMessage(statusMsg);
    sendSocketMessage(batteryMsg);
    sendSocketMessage(uptimeMsg);
    sendSocketMessage(sensorStatusMsg);
    
    xSemaphoreGive(statusMutex);
  }
}

void tien() {
  if (!motorEnabled) return;
  
  logMessage("Motor: Forward");
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
  
  // Sử dụng PWM channels riêng biệt
  ledcWrite(ENA, TOC_DO);
  ledcWrite(ENB, TOC_DO);
  
  if (xSemaphoreTake(statusMutex, 100 / portTICK_PERIOD_MS)) {
    currentStatus = "forward";
    xSemaphoreGive(statusMutex);
  }
}

void lui() {
  if (!motorEnabled) return;
  
  logMessage("Motor: Backward");
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);
  
  // Sử dụng PWM channels riêng biệt
  ledcWrite(ENA, TOC_DO);
  ledcWrite(ENB, TOC_DO);
  
  if (xSemaphoreTake(statusMutex, 100 / portTICK_PERIOD_MS)) {
    currentStatus = "backward";
    xSemaphoreGive(statusMutex);
  }
}

void reTrai() {
  if (!motorEnabled) return;

  logMessage("Motor: Curve Left");
  
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);

  ledcWrite(ENA, 200);
  ledcWrite(ENB, 200);

  if (xSemaphoreTake(statusMutex, 100 / portTICK_PERIOD_MS)) {
    currentStatus = "curve_left";
    xSemaphoreGive(statusMutex);
  }
}

void rePhai() {
  if (!motorEnabled) return;

  logMessage("Motor: Curve Right");
  
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);

  ledcWrite(ENA, 200);
  ledcWrite(ENB, 200);

  if (xSemaphoreTake(statusMutex, 100 / portTICK_PERIOD_MS)) {
    currentStatus = "curve_right";
    xSemaphoreGive(statusMutex);
  }
}

void dungLai() {
  logMessage("Motor: Stop");
  
  // Stop luôn được ưu tiên, không cần kiểm tra camera mutex
  int currentPWM = TOC_DO;
  for (int i = currentPWM; i >= 0; i -= 20) {
    ledcWrite(ENA, i);
    ledcWrite(ENB, i);
    vTaskDelay(5 / portTICK_PERIOD_MS);
  }
  
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
  ledcWrite(ENA, 0);
  ledcWrite(ENB, 0);
  
  if (xSemaphoreTake(statusMutex, 100 / portTICK_PERIOD_MS)) {
    currentStatus = "stopped";
    xSemaphoreGive(statusMutex);
  }
}

// ==================== SERIAL LOGGING FUNCTIONS ====================

void addToSerialLog(String message) {
  // Thêm timestamp
  String timestampedMessage = "[" + String(millis()) + "] " + message;
  
  // Thêm vào buffer
  serialLogBuffer[serialLogIndex] = timestampedMessage;
  serialLogIndex = (serialLogIndex + 1) % SERIAL_LOG_BUFFER_SIZE;
  
  if (serialLogIndex == 0) {
    serialLogFull = true;
  }
  
  // Gửi qua WebSocket cho real-time update
  if (serialLogWebSocket.connectedClients() > 0) {
    serialLogWebSocket.broadcastTXT(timestampedMessage);
  }
}

// Custom logging function that logs to both Serial and web logger
void logMessage(String message) {
  Serial.println(message);
  addToSerialLog(message);
}

void handleSerialLogRoot() {
  String html = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
    <title>ESP32 Serial Logger</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 20px;
            background-color: #1e1e1e;
            color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            color: white;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .controls {
            background-color: #2d2d2d;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            align-items: center;
        }
        .btn {
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.3s;
        }
        .btn:hover {
            background-color: #45a049;
        }
        .btn.danger {
            background-color: #f44336;
        }
        .btn.danger:hover {
            background-color: #da190b;
        }
        .status {
            padding: 5px 10px;
            border-radius: 5px;
            font-weight: bold;
        }
        .status.connected {
            background-color: #4CAF50;
            color: white;
        }
        .status.disconnected {
            background-color: #f44336;
            color: white;
        }
        .log-container {
            background-color: #2d2d2d;
            border: 1px solid #444;
            border-radius: 8px;
            height: 500px;
            overflow-y: auto;
            padding: 15px;
            font-size: 13px;
            line-height: 1.4;
        }
        .log-entry {
            margin-bottom: 5px;
            padding: 3px 0;
            border-bottom: 1px solid #333;
        }
        .log-entry:last-child {
            border-bottom: none;
        }
        .timestamp {
            color: #888;
            font-size: 11px;
        }
        .log-message {
            color: #fff;
            margin-left: 10px;
        }
        .info {
            background-color: #2d2d2d;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
            border-left: 4px solid #667eea;
        }
        .auto-scroll {
            margin-left: 10px;
        }
        .stats {
            display: flex;
            gap: 20px;
            margin-left: auto;
            font-size: 12px;
            color: #ccc;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 ESP32 Serial Logger</h1>
        <p>Real-time Serial Monitor & Logger</p>
    </div>
    
    <div class="info">
        <strong>📡 WebSocket:</strong> ws://)rawliteral" + WiFi.localIP().toString() + R"rawliteral(:8084<br>
        <strong>🌐 Web Interface:</strong> http://)rawliteral" + WiFi.localIP().toString() + R"rawliteral(:8083<br>
        <strong>📊 API Endpoint:</strong> /logs (JSON format)
    </div>
    
    <div class="controls">
        <button class="btn" onclick="connectWebSocket()">🔌 Connect</button>
        <button class="btn danger" onclick="disconnectWebSocket()">❌ Disconnect</button>
        <button class="btn" onclick="clearLogs()">🗑️ Clear Logs</button>
        <button class="btn" onclick="refreshLogs()">🔄 Refresh</button>
        <label class="auto-scroll">
            <input type="checkbox" id="autoScroll" checked> Auto Scroll
        </label>
        <div class="stats">
            <span>📦 Buffer: <span id="logCount">0</span>/50</span>
            <span>⏱️ Uptime: <span id="uptime">0</span>s</span>
        </div>
        <div class="status disconnected" id="wsStatus">Disconnected</div>
    </div>
    
    <div class="log-container" id="logContainer">
        <div class="log-entry">
            <span class="timestamp">[0]</span>
            <span class="log-message">🚀 ESP32 Serial Logger initialized. Waiting for connection...</span>
        </div>
    </div>

    <script>
        let ws = null;
        let logCount = 0;
        const maxLogs = 1000; // Client-side limit
        
        function connectWebSocket() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                console.log('WebSocket already connected');
                return;
            }
            
            const wsUrl = 'ws://)rawliteral" + WiFi.localIP().toString() + R"rawliteral(:8084';
            console.log('Connecting to:', wsUrl);
            
            ws = new WebSocket(wsUrl);
            
            ws.onopen = function() {
                console.log('✅ WebSocket connected');
                document.getElementById('wsStatus').textContent = 'Connected';
                document.getElementById('wsStatus').className = 'status connected';
                addLogEntry('[SYSTEM] WebSocket connected successfully');
            };
            
            ws.onmessage = function(event) {
                addLogEntry(event.data);
            };
            
            ws.onclose = function() {
                console.log('🔌 WebSocket disconnected');
                document.getElementById('wsStatus').textContent = 'Disconnected';
                document.getElementById('wsStatus').className = 'status disconnected';
                addLogEntry('[SYSTEM] WebSocket disconnected');
            };
            
            ws.onerror = function(error) {
                console.error('❌ WebSocket error:', error);
                addLogEntry('[ERROR] WebSocket connection failed');
            };
        }
        
        function disconnectWebSocket() {
            if (ws) {
                ws.close();
                ws = null;
            }
        }
        
        function addLogEntry(message) {
            const container = document.getElementById('logContainer');
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            
            // Parse timestamp if present
            let timestamp = new Date().toLocaleTimeString();
            let logMessage = message;
            
            if (message.startsWith('[') && message.includes(']')) {
                const endBracket = message.indexOf(']');
                const timestampPart = message.substring(1, endBracket);
                logMessage = message.substring(endBracket + 2);
                
                // Convert milliseconds to readable time
                if (!isNaN(timestampPart)) {
                    const ms = parseInt(timestampPart);
                    const seconds = Math.floor(ms / 1000);
                    const minutes = Math.floor(seconds / 60);
                    const hours = Math.floor(minutes / 60);
                    timestamp = `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}.${(ms % 1000).toString().padStart(3, '0')}`;
                }
            }
            
            entry.innerHTML = `
                <span class="timestamp">[${timestamp}]</span>
                <span class="log-message">${logMessage}</span>
            `;
            
            container.appendChild(entry);
            logCount++;
            
            // Limit logs to prevent memory issues
            if (logCount > maxLogs) {
                container.removeChild(container.firstChild);
                logCount--;
            }
            
            // Auto scroll if enabled
            if (document.getElementById('autoScroll').checked) {
                container.scrollTop = container.scrollHeight;
            }
            
            // Update log count
            document.getElementById('logCount').textContent = Math.min(logCount, 50);
        }
        
        function clearLogs() {
            fetch('/clear', { method: 'POST' })
                .then(response => response.text())
                .then(data => {
                    console.log('Logs cleared:', data);
                    document.getElementById('logContainer').innerHTML = '';
                    logCount = 0;
                    document.getElementById('logCount').textContent = '0';
                    addLogEntry('[SYSTEM] Logs cleared');
                })
                .catch(error => {
                    console.error('Error clearing logs:', error);
                    addLogEntry('[ERROR] Failed to clear logs');
                });
        }
        
        function refreshLogs() {
            fetch('/logs')
                .then(response => response.json())
                .then(data => {
                    const container = document.getElementById('logContainer');
                    container.innerHTML = '';
                    logCount = 0;
                    
                    data.logs.forEach(log => {
                        addLogEntry(log);
                    });
                    
                    addLogEntry('[SYSTEM] Logs refreshed from server');
                })
                .catch(error => {
                    console.error('Error refreshing logs:', error);
                    addLogEntry('[ERROR] Failed to refresh logs');
                });
        }
        
        function updateUptime() {
            fetch('/logs')
                .then(response => response.json())
                .then(data => {
                    if (data.uptime) {
                        document.getElementById('uptime').textContent = Math.floor(data.uptime / 1000);
                    }
                })
                .catch(error => {
                    console.error('Error getting uptime:', error);
                });
        }
        
        // Auto-connect on page load
        window.onload = function() {
            connectWebSocket();
            setInterval(updateUptime, 5000); // Update uptime every 5 seconds
        };
        
        // Reconnect on page focus
        window.onfocus = function() {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                connectWebSocket();
            }
        };
    </script>
</body>
</html>
)rawliteral";

  serialLogServer.send(200, "text/html", html);
}

void handleSerialLogs() {
  String json = "{\"logs\":[";
  
  int startIndex = serialLogFull ? serialLogIndex : 0;
  int count = serialLogFull ? SERIAL_LOG_BUFFER_SIZE : serialLogIndex;
  
  for (int i = 0; i < count; i++) {
    int index = (startIndex + i) % SERIAL_LOG_BUFFER_SIZE;
    if (i > 0) json += ",";
    json += "\"" + serialLogBuffer[index] + "\"";
  }
  
  json += "],\"count\":" + String(count);
  json += ",\"uptime\":" + String(millis());
  json += ",\"buffer_full\":" + String(serialLogFull ? "true" : "false");
  json += "}";
  
  serialLogServer.send(200, "application/json", json);
}

void handleClearLogs() {
  serialLogIndex = 0;
  serialLogFull = false;
  
  // Clear buffer
  for (int i = 0; i < SERIAL_LOG_BUFFER_SIZE; i++) {
    serialLogBuffer[i] = "";
  }
  
  addToSerialLog("Serial logs cleared");
  serialLogServer.send(200, "text/plain", "Logs cleared successfully");
}

void serialLogWebSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("Serial Log WebSocket [%u] Disconnected!\n", num);
      break;
      
    case WStype_CONNECTED:
      {
        IPAddress ip = serialLogWebSocket.remoteIP(num);
        Serial.printf("Serial Log WebSocket [%u] Connected from %d.%d.%d.%d\n", num, ip[0], ip[1], ip[2], ip[3]);
        
        // Send recent logs to new client
        int startIndex = serialLogFull ? serialLogIndex : 0;
        int count = serialLogFull ? SERIAL_LOG_BUFFER_SIZE : serialLogIndex;
        
        for (int i = 0; i < count; i++) {
          int index = (startIndex + i) % SERIAL_LOG_BUFFER_SIZE;
          if (serialLogBuffer[index].length() > 0) {
            serialLogWebSocket.sendTXT(num, serialLogBuffer[index]);
          }
        }
      }
      break;
      
    case WStype_TEXT:
      {
        String message = String((char*)payload);
        Serial.printf("Serial Log WebSocket [%u] Received: %s\n", num, message.c_str());
        
        if (message == "GET_LOGS") {
          // Send all logs
          int startIndex = serialLogFull ? serialLogIndex : 0;
          int count = serialLogFull ? SERIAL_LOG_BUFFER_SIZE : serialLogIndex;
          
          for (int i = 0; i < count; i++) {
            int index = (startIndex + i) % SERIAL_LOG_BUFFER_SIZE;
            if (serialLogBuffer[index].length() > 0) {
              serialLogWebSocket.sendTXT(num, serialLogBuffer[index]);
            }
          }
        }
      }
      break;
      
    default:
      break;
  }
}

// ==================== ARDUINO SENSOR FUNCTIONS ====================

// Task xử lý Arduino Sensor trên Core 0
void arduinoSensorTask(void *parameter) {
  String receivedData = "";
  unsigned long lastArduinoMessage = 0;
  unsigned long lastDebugLog = 0;
  
  logMessage("🚀 Arduino Sensor Task started - listening on UART1 (GPIO3, 9600 baud)");
  
  while (true) {
    // Debug log mỗi 10 giây
    if (millis() - lastDebugLog > 10000) {
      logMessage("📡 Arduino Sensor Task running - waiting for data on GPIO3...");
      lastDebugLog = millis();
    }
    
    // Đọc dữ liệu từ Arduino qua arduinoSerial (UART1)
    if (arduinoSerial.available()) {
      String message = arduinoSerial.readStringUntil('\n');
      message.trim();
      
      if (message.length() > 0) {
        lastArduinoMessage = millis();
        
        // Log message nhận được từ Arduino
        String logMsg = "📨 Arduino Raw Data: " + message;
        logMessage(logMsg);
        
        // Extract JSON từ string - tìm phần bắt đầu bằng { và kết thúc bằng }
        String jsonPart = extractJSON(message);
        
        if (jsonPart.length() > 0) {
          logMessage("📊 Extracted JSON: " + jsonPart);
          parseArduinoSensorData(jsonPart);
          
          // Gửi data qua WebSocket
          if (webSocket.connectedClients() > 0) {
            webSocket.broadcastTXT("SENSOR_DATA:" + jsonPart);
            logMessage("📡 Sent sensor data to WebSocket clients");
          }
        } else {
          logMessage("⚠️ No valid JSON found in: " + message);
        }
      }
    }
    
    // Kiểm tra timeout Arduino connection
    if (lastArduinoMessage > 0 && (millis() - lastArduinoMessage > 10000)) {
      // Nếu không nhận được data từ Arduino trong 10 giây
      static unsigned long lastTimeoutLog = 0;
      if (millis() - lastTimeoutLog > 30000) { // Log mỗi 30 giây
        logMessage("⚠️ No sensor data from Arduino for 10+ seconds");
        logMessage("🔍 Check Arduino D5 -> ESP32 GPIO3 connection");
        lastTimeoutLog = millis();
        
        // Mark sensor data as invalid
        if (xSemaphoreTake(sensorMutex, 100 / portTICK_PERIOD_MS)) {
          sensorData.dataValid = false;
          xSemaphoreGive(sensorMutex);
        }
      }
    }
    
    vTaskDelay(50 / portTICK_PERIOD_MS); // Check mỗi 50ms để responsive hơn
  }
}

// Function để extract JSON từ string có thể chứa ký tự lạ
String extractJSON(String input) {
  int startIndex = input.indexOf('{');
  int endIndex = input.lastIndexOf('}');
  
  if (startIndex != -1 && endIndex != -1 && endIndex > startIndex) {
    return input.substring(startIndex, endIndex + 1);
  }
  
  return "";
}

void parseArduinoSensorData(String jsonString) {
  DynamicJsonDocument doc(512);
  DeserializationError error = deserializeJson(doc, jsonString);
  
  if (error) {
    logMessage("❌ JSON parse error: " + String(error.c_str()));
    return;
  }
  
  // Cập nhật dữ liệu sensor với mutex protection
  if (xSemaphoreTake(sensorMutex, 100 / portTICK_PERIOD_MS)) {
    sensorData.temperature = doc["temperature"] | 0.0;
    sensorData.humidity = doc["humidity"] | 0.0;
    sensorData.fire = doc["fire"] | 0;
    sensorData.gas = doc["gas"] | 0;
    sensorData.analog1 = doc["analog1"] | 0;
    sensorData.analog2 = doc["analog2"] | 0;
    sensorData.dataValid = true;
    sensorData.lastUpdate = millis();
    sensorData.rawJson = jsonString;
    
    xSemaphoreGive(sensorMutex);
    
    // Log parsed data
    String logMsg = "📊 Sensor Data - ";
    logMsg += "Temp: " + String(sensorData.temperature, 1) + "°C, ";
    logMsg += "Humidity: " + String(sensorData.humidity, 1) + "%, ";
    logMsg += "Fire: " + String(sensorData.fire) + ", ";
    logMsg += "Gas: " + String(sensorData.gas) + ", ";
    logMsg += "A1: " + String(sensorData.analog1) + ", ";
    logMsg += "A2: " + String(sensorData.analog2);
    
    logMessage(logMsg);
  }
}

String handleSensorDataRequest() {
  if (xSemaphoreTake(sensorMutex, 100 / portTICK_PERIOD_MS)) {
    if (sensorData.dataValid) {
      String response = "SENSOR_DATA:" + sensorData.rawJson;
      xSemaphoreGive(sensorMutex);
      return response;
    } else {
      xSemaphoreGive(sensorMutex);
      return "SENSOR_DATA:ERROR:No valid sensor data available";
    }
  }
  return "SENSOR_DATA:ERROR:Unable to access sensor data";
}

String handleSensorStatusRequest() {
  if (xSemaphoreTake(sensorMutex, 100 / portTICK_PERIOD_MS)) {
    String response = "SENSOR_STATUS:";
    response += "valid:" + String(sensorData.dataValid ? "true" : "false") + ",";
    response += "last_update:" + String(sensorData.lastUpdate) + ",";
    response += "age:" + String(millis() - sensorData.lastUpdate) + "ms";
    
    if (sensorData.dataValid) {
      response += ",temp:" + String(sensorData.temperature, 1);
      response += ",humidity:" + String(sensorData.humidity, 1);
      response += ",fire:" + String(sensorData.fire);
      response += ",gas:" + String(sensorData.gas);
      response += ",analog1:" + String(sensorData.analog1);
      response += ",analog2:" + String(sensorData.analog2);
    }
    
    xSemaphoreGive(sensorMutex);
    return response;
  }
  return "SENSOR_STATUS:ERROR:Unable to access sensor status";
}

String handleAllSensorsRequest() {
  if (xSemaphoreTake(sensorMutex, 100 / portTICK_PERIOD_MS)) {
    if (sensorData.dataValid) {
      String allData = "ALL_SENSORS:";
      allData += "temp=" + String(sensorData.temperature, 1) + ",";
      allData += "humidity=" + String(sensorData.humidity, 1) + ",";
      allData += "fire=" + String(sensorData.fire) + ",";
      allData += "gas=" + String(sensorData.gas) + ",";
      allData += "analog1=" + String(sensorData.analog1) + ",";
      allData += "analog2=" + String(sensorData.analog2);
      xSemaphoreGive(sensorMutex);
      return allData;
    } else {
      xSemaphoreGive(sensorMutex);
      return "ALL_SENSORS:ERROR:No data available";
    }
  }
  return "ALL_SENSORS:ERROR:Unable to access sensor data";
}

String handleTemperatureRequest() {
  if (xSemaphoreTake(sensorMutex, 100 / portTICK_PERIOD_MS)) {
    if (sensorData.dataValid) {
      String response = "TEMPERATURE:" + String(sensorData.temperature, 1);
      xSemaphoreGive(sensorMutex);
      return response;
    } else {
      xSemaphoreGive(sensorMutex);
      return "TEMPERATURE:ERROR:No data";
    }
  }
  return "TEMPERATURE:ERROR:Unable to access sensor data";
}

String handleHumidityRequest() {
  if (xSemaphoreTake(sensorMutex, 100 / portTICK_PERIOD_MS)) {
    if (sensorData.dataValid) {
      String response = "HUMIDITY:" + String(sensorData.humidity, 1);
      xSemaphoreGive(sensorMutex);
      return response;
    } else {
      xSemaphoreGive(sensorMutex);
      return "HUMIDITY:ERROR:No data";
    }
  }
  return "HUMIDITY:ERROR:Unable to access sensor data";
}

String handleFireRequest() {
  if (xSemaphoreTake(sensorMutex, 100 / portTICK_PERIOD_MS)) {
    if (sensorData.dataValid) {
      String response = "FIRE:" + String(sensorData.fire);
      xSemaphoreGive(sensorMutex);
      return response;
    } else {
      xSemaphoreGive(sensorMutex);
      return "FIRE:ERROR:No data";
    }
  }
  return "FIRE:ERROR:Unable to access sensor data";
}

String handleGasRequest() {
  if (xSemaphoreTake(sensorMutex, 100 / portTICK_PERIOD_MS)) {
    if (sensorData.dataValid) {
      String response = "GAS:" + String(sensorData.gas);
      xSemaphoreGive(sensorMutex);
      return response;
    } else {
      xSemaphoreGive(sensorMutex);
      return "GAS:ERROR:No data";
    }
  }
  return "GAS:ERROR:Unable to access sensor data";
}

String handleAnalogRequest() {
  if (xSemaphoreTake(sensorMutex, 100 / portTICK_PERIOD_MS)) {
    if (sensorData.dataValid) {
      String analogData = "ANALOG:A1=" + String(sensorData.analog1) + ",A2=" + String(sensorData.analog2);
      xSemaphoreGive(sensorMutex);
      return analogData;
    } else {
      xSemaphoreGive(sensorMutex);
      return "ANALOG:ERROR:No data";
    }
  }
  return "ANALOG:ERROR:Unable to access sensor data";
}

String handleHelpRequest() {
  String helpMsg = "HELP:Commands available - ";
  helpMsg += "Motor: COMMAND:w/s/a/d/x, SPEED:50-150, ";
  helpMsg += "Sensors: GET_SENSOR_DATA, GET_ALL_SENSORS, GET_TEMPERATURE, GET_HUMIDITY, ";
  helpMsg += "GET_FIRE, GET_GAS, GET_ANALOG, SENSOR_STATUS, ";
  helpMsg += "System: STATUS, PING, HELP";
  return helpMsg;
}