import React, { useState, useEffect } from "react";
import { ScrollView, Text, View, StyleSheet, Alert } from "react-native";
import Button from "@/components/ui/Button";

export default function TestScreen() {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<string[]>([]);
    const [lastCommand, setLastCommand] = useState("");

    const ESP32_URL = "ws://192.168.1.14:81";

    // Kết nối WebSocket
    const connectWebSocket = () => {
        try {
            const ws = new WebSocket(ESP32_URL);
            
            ws.onopen = () => {
                console.log('✅ WebSocket connected to ESP32');
                setIsConnected(true);
                addMessage("🟢 Kết nối thành công tới ESP32");
            };

            ws.onmessage = (event) => {
                console.log('📥 Message from ESP32:', event.data);
                addMessage(`📥 ESP32: ${event.data}`);
            };

            ws.onclose = (event) => {
                console.log('🔌 WebSocket disconnected:', event.code);
                setIsConnected(false);
                addMessage(`🔴 Ngắt kết nối (Code: ${event.code})`);
            };

            ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                addMessage("❌ Lỗi kết nối WebSocket");
                Alert.alert("Lỗi", "Không thể kết nối tới ESP32");
            };

            setSocket(ws);
        } catch (error) {
            console.error('❌ Failed to create WebSocket:', error);
            Alert.alert("Lỗi", "Không thể tạo kết nối WebSocket");
        }
    };

    // Ngắt kết nối
    const disconnectWebSocket = () => {
        if (socket) {
            socket.close();
            setSocket(null);
        }
    };

    // Gửi lệnh
    const sendCommand = (command: string, description: string) => {
        if (!socket || !isConnected) {
            Alert.alert("Lỗi", "Chưa kết nối tới ESP32");
            return;
        }

        const message = `COMMAND:${command}`;
        socket.send(message);
        setLastCommand(description);
        addMessage(`📤 Gửi: ${message} (${description})`);
    };

    // Thêm tin nhắn vào log
    const addMessage = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setMessages(prev => [...prev, `[${timestamp}] ${message}`].slice(-20));
    };

    // Cleanup khi component unmount
    useEffect(() => {
        return () => {
            if (socket) {
                socket.close();
            }
        };
    }, [socket]);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>🧪 ESP32 WebSocket Test</Text>
            
            {/* Thông tin kết nối */}
            <View style={styles.statusContainer}>
                <Text style={[styles.statusText, { color: isConnected ? '#4CAF50' : '#f44336' }]}>
                    {isConnected ? '🟢 Đã kết nối' : '🔴 Chưa kết nối'}
                </Text>
                <Text style={styles.urlText}>URL: {ESP32_URL}</Text>
                {lastCommand && (
                    <Text style={styles.commandText}>Lệnh cuối: {lastCommand}</Text>
                )}
            </View>

            {/* Nút kết nối */}
            <View style={styles.buttonRow}>
                <Button 
                    title="🔗 Kết nối"
                    onPress={connectWebSocket}
                    disabled={isConnected}
                    style={[styles.button, { backgroundColor: isConnected ? '#ccc' : '#4CAF50' }]}
                />
                <Button 
                    title="🔌 Ngắt kết nối"
                    onPress={disconnectWebSocket}
                    disabled={!isConnected}
                    style={[styles.button, { backgroundColor: !isConnected ? '#ccc' : '#f44336' }]}
                />
            </View>

            {/* Nút điều khiển */}
            <Text style={styles.sectionTitle}>🎮 Điều khiển di chuyển (Giữ nút):</Text>
            <View style={styles.controlGrid}>
                <View style={styles.controlRow}>
                    <Button 
                        title="⬆️ Tiến"
                        onPress={() => {}}
                        onPressIn={() => sendCommand("w", "Tiến")}
                        onPressOut={() => sendCommand("x", "Dừng")}
                        disabled={!isConnected}
                        style={styles.controlButton}
                    />
                </View>
                <View style={styles.controlRow}>
                    <Button 
                        title="⬅️ Trái"
                        onPress={() => {}}
                        onPressIn={() => sendCommand("a", "Trái")}
                        onPressOut={() => sendCommand("x", "Dừng")}
                        disabled={!isConnected}
                        style={styles.controlButton}
                    />
                    <Button 
                        title="⏹️ Dừng"
                        onPress={() => sendCommand("x", "Dừng")}
                        disabled={!isConnected}
                        style={[styles.controlButton, { backgroundColor: '#ff4444' }]}
                    />
                    <Button 
                        title="➡️ Phải"
                        onPress={() => {}}
                        onPressIn={() => sendCommand("d", "Phải")}
                        onPressOut={() => sendCommand("x", "Dừng")}
                        disabled={!isConnected}
                        style={styles.controlButton}
                    />
                </View>
                <View style={styles.controlRow}>
                    <Button 
                        title="⬇️ Lùi"
                        onPress={() => {}}
                        onPressIn={() => sendCommand("s", "Lùi")}
                        onPressOut={() => sendCommand("x", "Dừng")}
                        disabled={!isConnected}
                        style={styles.controlButton}
                    />
                </View>
            </View>

            {/* Các lệnh khác */}
            <Text style={styles.sectionTitle}>🔧 Lệnh khác:</Text>
            <View style={styles.buttonRow}>
                <Button 
                    title="📊 STATUS"
                    onPress={() => socket?.send("STATUS")}
                    disabled={!isConnected}
                    style={styles.smallButton}
                />
                <Button 
                    title="🏓 PING"
                    onPress={() => socket?.send("PING")}
                    disabled={!isConnected}
                    style={styles.smallButton}
                />
                <Button 
                    title="⚡ SPEED:100"
                    onPress={() => socket?.send("SPEED:100")}
                    disabled={!isConnected}
                    style={styles.smallButton}
                />
            </View>

            {/* Log tin nhắn */}
            <Text style={styles.sectionTitle}>📝 Log tin nhắn:</Text>
            <View style={styles.logContainer}>
                {messages.length === 0 ? (
                    <Text style={styles.logEmpty}>Chưa có tin nhắn...</Text>
                ) : (
                    messages.map((message, index) => (
                        <Text key={index} style={styles.logMessage}>
                            {message}
                        </Text>
                    ))
                )}
            </View>

            <Button 
                title="🗑️ Xóa log"
                onPress={() => setMessages([])}
                style={{ backgroundColor: '#666', marginTop: 10 }}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 16,
        gap: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    statusContainer: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statusText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    urlText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    commandText: {
        fontSize: 14,
        color: '#2196F3',
        fontStyle: 'italic',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 10,
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 10,
    },
    button: {
        flex: 1,
        minHeight: 50,
    },
    controlGrid: {
        alignItems: 'center',
        gap: 10,
    },
    controlRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
    },
    controlButton: {
        width: 80,
        height: 50,
        backgroundColor: '#2196F3',
    },
    smallButton: {
        flex: 1,
        backgroundColor: '#FF9800',
        minHeight: 40,
    },
    logContainer: {
        backgroundColor: '#000',
        borderRadius: 8,
        padding: 10,
        minHeight: 200,
        maxHeight: 300,
    },
    logEmpty: {
        color: '#888',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    logMessage: {
        color: '#0f0',
        fontSize: 12,
        fontFamily: 'monospace',
        marginBottom: 2,
    },
});