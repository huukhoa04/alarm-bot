import Button from "@/components/ui/Button";
import ControlPanel from "@/components/ui/ControlPanel";
import Loading from "@/components/ui/Loading";
import VideoFeed from "@/components/ui/VideoFeed";
import config from "@/constants/config";
import { useWebSocket } from "@/contexts/WsProvider";
import { useToast } from "@/hooks/useToast";
import { MappedSensorItem } from "@/types/session";
import { toSensorItems } from "@/utils/mapSensorItems";
import { supabase } from "@/utils/supabase";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function ControlScreen() {
  const {
    isConnected,
    socket,
    sendMessage,
    error,
    connectWebSocket,
    reconnect,
    disconnect,
  } = useWebSocket();
  const emptyLiveData = {
    hasFire: 0,
    hasGas: 0,
    temperature: [],
    humidity: [],
    gasPressure: [],
    firePressure: [],
  }
  const [liveData, setLiveData] = useState<{
      temperature: MappedSensorItem[];
      humidity: MappedSensorItem[];
      gasPressure: MappedSensorItem[];
      firePressure: MappedSensorItem[];
    }>({
      temperature: [],
      humidity: [],
      gasPressure: [],
      firePressure: [],
    });
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({
    isFire: 0,
    hasGas: 0,
  });
  const [speed, setSpeed] = useState(100); // Example state for speed control
  const router = useRouter();
  const handleConnect = () => {
    if (isConnected) {
      console.log("Disconnecting from drone...");
      disconnect(); // Remove the setTimeout, call directly
      return;
    } else if (error) {
      console.log("Error occurred, attempting to reconnect...");
      reconnect(); // Remove the setTimeout, call directly
      return;
    } else {
      console.log("Connecting to drone...");
      connectWebSocket(); // Remove the setTimeout, call directly
      return;
    }
  };

  const controlEvent = useMemo(() => {
    return {
      forward: () => sendMessage("w"),
      back: () => sendMessage("s"),
      left: () => sendMessage("a"),
      right: () => sendMessage("d"),
      stop: () => sendMessage("x"),
    };
  }, [isConnected]);
  const addToSupabase = async () => {
    if (liveData.temperature.length === 0) {
      toast.show("No data to add to Supabase.", "info");
      return;
    }
    const { data, error } = await supabase.from("sessions").insert([
      {
        stats: {
          temperature: toSensorItems(liveData.temperature),
          humidity: toSensorItems(liveData.humidity),
          gasPressure: toSensorItems(liveData.gasPressure),
          firePressure: toSensorItems(liveData.firePressure),
        },
      },
    ]);
    if (error) {
      toast.show("Error adding data to Supabase: " + error.message, "error");
      console.error("Error adding data to Supabase:", error);
      return;
    }
    toast.show("Data added to Supabase successfully!", "success");
  };

  useEffect(() => {
    if(socket && isConnected) {
    const originalOnMessage = socket.onmessage;
    socket.onmessage = (event) => {
        // Call original handler first
        if (originalOnMessage) {
          originalOnMessage.call(socket, event);
        }
        // Handle incoming messages
        if (event.data.match(/SENSOR_DATA:/)) {
          try {
            const sensorData = JSON.parse(event.data.replace("SENSOR_DATA:", ""));
            setLiveData(prev => ({
              ...prev,
              temperature: [...prev.temperature, { value: sensorData.temperature, dataPointText: String(sensorData.temperature), label: new Date().toLocaleTimeString() }],
              humidity: [...prev.humidity, { value: sensorData.humidity, dataPointText: String(sensorData.humidity), label: new Date().toLocaleTimeString() }],
              gasPressure: [...prev.gasPressure, { value: sensorData.analog1, dataPointText: String(sensorData.analog1), label: new Date().toLocaleTimeString() }],
              firePressure: [...prev.firePressure, { value: sensorData.analog2, dataPointText: String(sensorData.analog2), label: new Date().toLocaleTimeString() }],
            }));
            setStatus({
              isFire: sensorData.fire || 0,
              hasGas: sensorData.gas || 0,
            });
          } catch (e) {
            console.error("Error parsing sensor data:", e);
          }
        }
    }
    }
  }, [isConnected, socket, error]);
  useEffect(() => {
    if(status.isFire === 1 && status.hasGas === 1) {
      toast.show("🔥💨 Flame and gas detected! Please take action immediately.", "error");
    }
    else
    if(status.isFire === 1) {
      toast.show("🔥 Flame detected! Please take action.", "error");
    }
    else if(status.hasGas === 1)
    {
      toast.show("💨 Gas detected! Please take action.", "error");
    }
    
  }, [status]);

  // Handle disconnection and data saving
  useEffect(() => {
    // Only save when we transition from connected to disconnected AND have data
    if (isConnected === false && liveData.temperature.length > 0) {
      console.log("WebSocket disconnected, saving data...");
      addToSupabase();
      // Clear data after a delay to ensure save completes
      setTimeout(() => {
        setLiveData(emptyLiveData);
      }, 1000);
    }
  }, [isConnected]);
  

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
    >
      {loading && <Loading />}
      {error && (
        <>
          <View style={styles.announceContainer}>
            <Text style={{ color: "#f00", fontSize: 16, fontWeight: "bold" }}>
              Error: {error}
            </Text>
          </View>
        </>
      )}
      {isConnected && (
        <>
          <VideoFeed videoFeed={config.CAMERA} />
          {/* <CustomSlider 
            label="Speed Control"
            value={speed}
            onValueChange={(value) => setSpeed(value)}
            onSlidingComplete={(value) => sendMessage(`SPEED:${value}`)}
            minimumValue={0}
            maximumValue={150}
            minimumTrackTintColor="#1f2"
            maximumTrackTintColor="#ccc"
          /> */}
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              width: "100%",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            HOLD the buttons to control the mini car
          </Text>
          <ControlPanel controlEvent={controlEvent} />
        </>
      )}
      <Button
        title={
          isConnected
            ? "Disconnect"
            : error
              ? "Reconnect"
              : "Connect to Mini Car"
        }
        onPress={handleConnect}
        loading={loading}
        disabled={loading}
        style={{
          backgroundColor: isConnected ? "#f00" : error ? "#f0f" : "#1f2",
        }}
      />
      <Button
        title="Open Stats Modal"
        onPress={() => router.push("/control/stats")}
        style={{ backgroundColor: "#00f" }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#fff",
  },
  content: {
    padding: 16,
    gap: 16,
    alignItems: "center",
  },
  announceContainer: {
    width: "100%",
    padding: 16,
    backgroundColor: "#ffb3b3",
    borderColor: "#ff0000",
    borderWidth: 2,
    borderRadius: 12,
  },
});
