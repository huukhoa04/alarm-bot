# 🤖 ESP32 Robot Controller Mobile App

Ứng dụng React Native để điều khiển robot ESP32 qua WebSocket.

## 🚀 Tính năng

- ✅ Kết nối WebSocket tới ESP32 (ws://192.168.1.14:81)
- 🎮 Điều khiển di chuyển: Tiến/Lùi/Trái/Phải/Dừng
- 📹 Xem camera stream từ ESP32
- 📊 Theo dõi trạng thái robot (pin, uptime)
- 🧪 Test screen để debug kết nối
- 🔄 Auto-reconnection và error handling

## 📱 Cài đặt và chạy

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Chạy ứng dụng

```bash
# Development server
npm start

# Android emulator
npm run android

# iOS simulator (chỉ trên macOS)
npm run ios

# Web browser
npm run web
```

## 🔧 Cấu hình ESP32

### IP Address
Cập nhật IP ESP32 trong `constants/config.ts`:
```typescript
const config = {
  WS: "ws://192.168.1.14:81",        // WebSocket
  CAMERA: "http://192.168.1.14:82/stream", // Camera stream (Updated port)
};
```

### Protocol giao tiếp

**Gửi từ Mobile → ESP32:**
- `COMMAND:w` - Di chuyển tiến
- `COMMAND:s` - Di chuyển lùi  
- `COMMAND:a` - Rẽ trái
- `COMMAND:d` - Rẽ phải
- `COMMAND:x` - Dừng lại
- `SPEED:100` - Đặt tốc độ (50-150)
- `STATUS` - Lấy trạng thái
- `PING` - Kiểm tra kết nối

**Nhận từ ESP32 → Mobile:**
- `CONNECTED:ESP32 Robot Controller Ready`
- `STATUS:forward` - Trạng thái di chuyển
- `BATTERY:95` - Mức pin (%)
- `UPTIME:120` - Thời gian hoạt động (giây)
- `RESPONSE:Moving forward` - Phản hồi lệnh
- `PONG:OK` - Phản hồi ping
- `ERROR:Motor system disabled` - Thông báo lỗi

## 📱 Cách sử dụng

### 1. Control Screen (Màn hình chính)
- Nhấn **"Kết nối ESP32"** để kết nối
- Sử dụng **ControlPanel** để điều khiển:
  - ⬆️ Tiến (Giữ nút để di chuyển, thả ra để dừng)
  - ⬇️ Lùi (Giữ nút để di chuyển, thả ra để dừng)
  - ⬅️ Trái (Giữ nút để di chuyển, thả ra để dừng)
  - ➡️ Phải (Giữ nút để di chuyển, thả ra để dừng)
- Nhấn **"🚨 DỪNG KHẨN CẤP"** để dừng ngay lập tức
- Xem camera stream và thông tin trạng thái

### 2. Test Screen (Màn hình test)
- Kết nối trực tiếp tới WebSocket
- Test từng lệnh điều khiển (Giữ nút để di chuyển, thả ra để dừng)
- Xem log tin nhắn real-time
- Debug kết nối và protocol

## 🎮 Event Handlers

### Control Events
```typescript
const controlEvents = {
    forward: () => sendControlCommand("w", "Tiến"),
    back: () => sendControlCommand("s", "Lùi"),
    left: () => sendControlCommand("a", "Trái"),
    right: () => sendControlCommand("d", "Phải"),
    stop: () => sendControlCommand("x", "Dừng")
};
```

### WebSocket Connection
```typescript
const { socket, isConnected, error, sendMessage, reconnect } = useWebSocket();

// Gửi lệnh
const sendControlCommand = (command: string, description: string) => {
    if (!isConnected) {
        Alert.alert("Lỗi kết nối", "Chưa kết nối tới ESP32");
        return;
    }
    
    sendMessage(`COMMAND:${command}`);
    setLastCommand(description);
};
```

## 🔍 Troubleshooting

### Không kết nối được ESP32
1. ✅ Kiểm tra ESP32 đã bật và kết nối WiFi
2. ✅ Đảm bảo mobile và ESP32 cùng mạng WiFi
3. ✅ Kiểm tra IP address đúng: `192.168.1.14`
4. ✅ Kiểm tra port WebSocket: `81`
5. ✅ Thử ping ESP32: `ping 192.168.1.14`

### Lệnh không hoạt động
1. ✅ Kiểm tra kết nối WebSocket (màu xanh)
2. ✅ Xem log tin nhắn trong Test screen
3. ✅ Kiểm tra ESP32 có phản hồi `RESPONSE:...`
4. ✅ Thử gửi `PING` và chờ `PONG`

### Camera không hiển thị
1. ✅ Kiểm tra URL camera: `http://192.168.1.14:82/stream` (Updated port)
2. ✅ Thử mở URL trong browser
3. ✅ Kiểm tra ESP32-CAM module và camera initialization

## 📁 Cấu trúc project

```
alarm-bot/
├── app/(main)/
│   ├── control/
│   │   ├── index.tsx          # Màn hình điều khiển chính
│   │   └── stats.tsx          # Thống kê
│   ├── test.tsx               # Test WebSocket
│   └── index.tsx              # Home screen
├── components/ui/
│   ├── ControlPanel/          # Panel điều khiển
│   ├── Button/                # Button component
│   ├── VideoFeed/             # Camera stream
│   └── Loading/               # Loading indicator
├── contexts/
│   └── WsProvider.tsx         # WebSocket context
├── constants/
│   └── config.ts              # Cấu hình IP/URL
└── README.md                  # Tài liệu này
```

## 🛠️ Development

### Thêm lệnh mới
1. Cập nhật ESP32 code để xử lý lệnh
2. Thêm event handler trong `controlEvents`
3. Thêm button trong `ControlPanel`

### Thay đổi IP ESP32
1. Cập nhật `constants/config.ts`
2. Restart app để áp dụng thay đổi

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. 🔍 Console logs trong app
2. 🔍 Serial monitor của ESP32
3. 🔍 Network connectivity
4. 🔍 Test screen để debug

---

## 🆕 Cập nhật mới

### ESP32 với Camera Stream và FreeRTOS
- ✅ **Camera Stream**: MJPEG trên port 82 (`http://192.168.1.14:82/stream`)
- ✅ **FreeRTOS**: Xử lý song song motor và camera
- ✅ **Multi-Core**: Core 0 cho motor/WebSocket, Core 1 cho camera
- ✅ **Thread-Safe**: Sử dụng Mutex và Queue
- ✅ **Performance**: Motor response < 50ms, Camera ~10 FPS

Xem chi tiết trong `README_ESP32_CAMERA.md`

**Lưu ý:** Đảm bảo ESP32-CAM đã upload code `esp32_websocket_fixed.ino` mới với camera support và kết nối cùng mạng WiFi với mobile device.
