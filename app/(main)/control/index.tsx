import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet, Text, View, Alert } from "react-native";
import { useRouter } from "expo-router";
import Button from "@/components/ui/Button";
import ControlPanel from "@/components/ui/ControlPanel";
import Loading from "@/components/ui/Loading";
import VideoFeed from "@/components/ui/VideoFeed";
import config from "@/constants/config";
import { useWebSocket } from "@/contexts/WsProvider";

export default function ControlScreen() {
    const [loading, setLoading] = useState(false);
    const [robotStatus, setRobotStatus] = useState("stopped");
    const [batteryLevel, setBatteryLevel] = useState(100);
    const [lastCommand, setLastCommand] = useState("");
    const [currentSpeed, setCurrentSpeed] = useState(100);
    const router = useRouter();
    
    // Sử dụng WebSocket context
    const { socket, isConnected, error, sendMessage, reconnect } = useWebSocket();

    // Lắng nghe tin nhắn từ ESP32
    useEffect(() => {
        if (socket) {
            const handleMessage = (event: MessageEvent) => {
                console.log("📥 Received from ESP32:", event.data);
                const message = event.data;
                
                // Xử lý các loại tin nhắn từ ESP32
                if (message.includes(':')) {
                    const [type, data] = message.split(':', 2);
                    
                    switch(type) {
                        case 'STATUS':
                            setRobotStatus(data);
                            break;
                        case 'BATTERY':
                            setBatteryLevel(parseInt(data));
                            break;
                        case 'RESPONSE':
                            console.log("✅ ESP32 Response:", data);
                            break;
                        case 'CONNECTED':
                            console.log("🔗 ESP32 Connected:", data);
                            break;
                        case 'PONG':
                            console.log("🏓 Pong received");
                            break;
                        case 'ERROR':
                            Alert.alert("ESP32 Error", data);
                            break;
                        case 'SPEED':
                            console.log("🚀 Speed updated:", data);
                            break;
                    }
                }
            };
            
            socket.addEventListener('message', handleMessage);
            
            return () => {
                socket.removeEventListener('message', handleMessage);
            };
        }
    }, [socket]);

    // Hàm gửi lệnh điều khiển
    const sendControlCommand = (command: string, description: string) => {
        if (!isConnected) {
            Alert.alert("Lỗi kết nối", "Chưa kết nối tới ESP32. Vui lòng kết nối trước.");
            return;
        }
        
        console.log(`📤 Sending command: ${command} (${description})`);
        sendMessage(`COMMAND:${command}`);
        setLastCommand(description);
    };

    // Hàm gửi lệnh thay đổi tốc độ
    const sendSpeedCommand = (speed: number) => {
        if (!isConnected) {
            Alert.alert("Lỗi kết nối", "Chưa kết nối tới ESP32. Vui lòng kết nối trước.");
            return;
        }
        
        console.log(`📤 Sending speed: ${speed}`);
        sendMessage(`SPEED:${speed}`);
        setLastCommand(`Đặt tốc độ: ${speed}`);
    };

    // Hàm xử lý thay đổi tốc độ
    const handleSpeedChange = (speed: number) => {
        const roundedSpeed = Math.round(speed);
        setCurrentSpeed(roundedSpeed);
        sendSpeedCommand(roundedSpeed);
    };

    // Các event handlers cho điều khiển
    const controlEvents = {
        forward: () => sendControlCommand("w", "Tiến"),
        back: () => sendControlCommand("s", "Lùi"),
        left: () => sendControlCommand("a", "Trái"),
        right: () => sendControlCommand("d", "Phải"),
        stop: () => sendControlCommand("x", "Dừng")
    };

    // Hàm kết nối/ngắt kết nối
    const handleConnect = () => {
        if (isConnected) {
            console.log("Disconnecting from ESP32...");
            setLoading(true);
            // Gửi lệnh dừng trước khi ngắt kết nối
            sendMessage("COMMAND:x");
            setTimeout(() => {
                if (socket) {
                    socket.close();
                }
                setLoading(false);
            }, 1000);
        } else {
            console.log("Connecting to ESP32...");
            setLoading(true);
            reconnect();
            // Kiểm tra kết nối sau 3 giây
            setTimeout(() => {
                setLoading(false);
                if (!isConnected) {
                    Alert.alert(
                        "Lỗi kết nối", 
                        "Không thể kết nối tới ESP32. Kiểm tra:\n• ESP32 đã bật chưa?\n• WiFi cùng mạng?\n• IP đúng: 192.168.1.14?"
                    );
                }
            }, 3000);
        }
    };

    // Gửi ping định kỳ để kiểm tra kết nối
    useEffect(() => {
        if (isConnected) {
            const pingInterval = setInterval(() => {
                sendMessage("PING");
            }, 5000);
            
            return () => clearInterval(pingInterval);
        }
    }, [isConnected]);

    return(
        <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
        >
            {loading && <Loading />}
            
            {/* Thông tin kết nối */}
            <View style={styles.statusContainer}>
                <Text style={[styles.statusText, { color: isConnected ? '#4CAF50' : '#f44336' }]}>
                    {isConnected ? '🟢 Đã kết nối ESP32' : '🔴 Chưa kết nối'}
                </Text>
                {error && (
                    <Text style={styles.errorText}>❌ {error}</Text>
                )}
                <Text style={styles.infoText}>
                    Trạng thái: {robotStatus} | 🔋 Pin: {batteryLevel}% | 🚀 Tốc độ: {currentSpeed}
                </Text>
                {lastCommand && (
                    <Text style={styles.commandText}>
                        📤 Lệnh cuối: {lastCommand}
                    </Text>
                )}
            </View>
            
            {isConnected && (
                <>
                    <VideoFeed 
                        videoFeed={config.CAMERA}
                    />
                    <ControlPanel 
                        controlEvent={controlEvents}
                        onSpeedChange={handleSpeedChange}
                        currentSpeed={currentSpeed}
                    />
                    
                    {/* Nút dừng khẩn cấp */}
                    <Button 
                        title="🚨 DỪNG KHẨN CẤP"
                        onPress={controlEvents.stop}
                        style={{ backgroundColor: '#ff4444', marginTop: 10 }}
                    />
                </>
            )}
            
            <Button 
                title={isConnected ? "Ngắt kết nối ESP32" : "Kết nối ESP32"}
                onPress={handleConnect}
                loading={loading}
                disabled={loading}
                style={{ backgroundColor: isConnected ? '#f44336' : '#4CAF50' }}
            />
            
            <Button 
                title="📊 Xem thống kê"
                onPress={() => router.push("/control/stats")}
                style={{ backgroundColor: '#2196F3' }}
            />
            
            {/* Hướng dẫn sử dụng */}
            <View style={styles.instructionContainer}>
                <Text style={styles.instructionTitle}>🎮 Hướng dẫn điều khiển:</Text>
                <Text style={styles.instructionText}>• ⬆️ Tiến • ⬇️ Lùi • ⬅️ Trái • ➡️ Phải</Text>
                <Text style={styles.instructionText}>• Giữ nút để di chuyển, thả ra để dừng tự động</Text>
                <Text style={styles.instructionText}>• 🚀 Kéo thanh trượt để điều chỉnh tốc độ (50-150)</Text>
                <Text style={styles.instructionText}>• IP ESP32: 192.168.1.14:4444</Text>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
        gap: 16,
        alignItems: "center",
    },
    statusContainer: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    errorText: {
        color: '#f44336',
        fontSize: 14,
        marginBottom: 5,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    commandText: {
        fontSize: 12,
        color: '#2196F3',
        fontStyle: 'italic',
    },
    instructionContainer: {
        backgroundColor: '#e3f2fd',
        padding: 15,
        borderRadius: 10,
        width: '100%',
        marginTop: 10,
    },
    instructionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    instructionText: {
        fontSize: 14,
        color: '#1976d2',
        textAlign: 'center',
        marginBottom: 3,
    },
});