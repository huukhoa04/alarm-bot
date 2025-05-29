import { useWebSocket } from "@/contexts/WsProvider";
import { MappedSensorItem } from "@/types/session";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CurveType, LineChart } from "react-native-gifted-charts";

export default function StatsScreen() {
  const [liveData, setLiveData] = useState<{
    hasFire: number;
    hasGas: number;
    temperature: MappedSensorItem[];
    humidity: MappedSensorItem[];
    gasPressure: MappedSensorItem[];
    firePressure: MappedSensorItem[];
  }>({
    hasFire: 0,
    hasGas: 1,
    temperature: [],
    humidity: [],
    gasPressure: [],
    firePressure: [],
  }); // Initialize with an empty array
  const [loading, setLoading] = useState(false);
  const { socket, isConnected, error } = useWebSocket();

  
  useEffect(() => {
    let interval: number | null = null;

    if (isConnected && socket) {
      console.log("WebSocket connected from StatsScreen");
      setLoading(false);

      // DON'T override the message handler - use a custom event system instead
      // Store the original handler and add our own logic
      const originalOnMessage = socket.onmessage;
      socket.onmessage = (event) => {
        // Call original handler first
        if (originalOnMessage) {
          originalOnMessage.call(socket, event);
        }

        console.log("WebSocket message received from StatsScreen:", event["data"]);
        if (event.data.match(/SENSOR_DATA:/)) {
          try {
            const sensorData = JSON.parse(event.data.replace("SENSOR_DATA:", ""));
            setLiveData(prev => ({
              ...prev,
              hasFire: sensorData.fire ?? 0,
              hasGas: sensorData.gas ?? 1,
              temperature: [...prev.temperature, { value: sensorData.temperature, dataPointText: String(sensorData.temperature), label: new Date().toLocaleTimeString() }],
              humidity: [...prev.humidity, { value: sensorData.humidity, dataPointText: String(sensorData.humidity), label: new Date().toLocaleTimeString() }],
              gasPressure: [...prev.gasPressure, { value: sensorData.analog1, dataPointText: String(sensorData.analog1), label: new Date().toLocaleTimeString() }],
              firePressure: [...prev.firePressure, { value: sensorData.analog2, dataPointText: String(sensorData.analog2), label: new Date().toLocaleTimeString() }],
            }));
          } catch (e) {
            console.error("Error parsing sensor data:", e);
          }
        }
      };

    } else if (error) {
      setLoading(false);
      console.error("WebSocket error from StatsScreen:", error);
    } else {
      setLoading(true);
    }

    // Cleanup
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isConnected, socket, error]);



  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={{ color: "#000", fontSize: 28, fontWeight: "bold" }}>
        Live Statistic
      </Text>

      <Text style={{ color: "#000", fontSize: 12 }}>
        The statistics below are updated every 2 seconds with random values.
        This is a simulation of real-time data.
      </Text>
      {!isConnected && (
        <Text style={{ color: "#ff0000", fontSize: 16 }}>
          {error ? `Error: ${error}` : "WebSocket is not connected."}
        </Text>
      )}
      {isConnected && (
        <>
          <View
            style={{
              ...styles.announceContainer,
              backgroundColor: liveData.hasFire == 1 || liveData.hasGas == 0 ? "#ffb3b3" : "#b3ffb3",
              borderColor: liveData.hasFire == 1 || liveData.hasGas == 0 ? "#ff0000" : "#009900",
              borderWidth: 2,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                color: liveData.hasFire == 1 || liveData.hasGas == 0 ? "#ff0000" : "#009900",
                fontSize: 20,
                fontWeight: "bold",
              }}
            >
              {liveData.hasFire == 1 ? "🔥 Flame Detected!" : "✅ No Flame Detected"}
              {liveData.hasGas == 0 ? " 💨 Gas Detected!" : "✅ No Gas Detected"}
            </Text>
          </View>
          <View style={styles.chartContainer}>
            <Text style={{ color: "#000", fontSize: 16, fontWeight: "bold" }}>
              Temperature (°C)
            </Text>
            <LineChart
              animationEasing={"easeInOut"}
              areaChart
              startFillColor="red"
              endFillColor="red"
              startOpacity={0.4}
              endOpacity={0.01}
              initialSpacing={0}
              data={liveData.temperature.slice(-20)}
              spacing={100}
              textColor="black"
              textShiftY={-8}
              textShiftX={-10}
              thickness={2}
              textFontSize={13}
              focusEnabled
              dataPointsColor="red"
              showStripOnFocus
              showTextOnFocus
              curved
              curveType={CurveType.QUADRATIC}
              // hideRules
              yAxisColor="#F44336"
              showVerticalLines
              verticalLinesColor="rgba(244,67,54,0.3)"
              xAxisColor="#F44336"
              color="#F44336"
              curvature={1}
              maxValue={100}
            />
          </View>
          <View style={styles.chartContainer}>
            <Text style={{ color: "#000", fontSize: 16, fontWeight: "bold" }}>
              Humidity (%)
            </Text>
            <LineChart
              animationEasing={"easeInOut"}
              areaChart
              startFillColor="#648DB3"
              endFillColor="#648DB3"
              startOpacity={0.4}
              endOpacity={0.01}
              initialSpacing={0}
              data={liveData.humidity.slice(-20)}
              spacing={100}
              textColor="black"
              textShiftY={-8}
              textShiftX={-10}
              thickness={2}
              textFontSize={13}
              focusEnabled
              dataPointsColor="#5459AC"
              showStripOnFocus
              showTextOnFocus
              curved
              curveType={CurveType.QUADRATIC}
              // hideRules
              yAxisColor="#648DB3"
              showVerticalLines
              verticalLinesColor="#8DD8FF"
              xAxisColor="#648DB3"
              color="#648DB3"
              curvature={1}
            />
          </View>
          <View style={styles.chartContainer}>
            <Text style={{ color: "#000", fontSize: 16, fontWeight: "bold" }}>
              Gas Sensor Analog Value
            </Text>
            <LineChart
              animationEasing={"easeInOut"}
              areaChart
              startFillColor="#FF9B17"
              endFillColor="#FF9B17"
              startOpacity={0.4}
              endOpacity={0.01}
              initialSpacing={0}
              data={liveData.gasPressure.slice(-20)}
              spacing={100}
              textColor="black"
              textShiftY={-8}
              textShiftX={-10}
              thickness={2}
              textFontSize={13}
              focusEnabled
              dataPointsColor="#EA7300"
              showStripOnFocus
              showTextOnFocus
              curved
              curveType={CurveType.QUADRATIC}
              // hideRules
              yAxisColor="#FF9B17"
              showVerticalLines
              verticalLinesColor="#FFA55D"
              xAxisColor="#FF9B17"
              color="#FF9B17"
              curvature={1}
            />
          </View>
          <View style={styles.chartContainer}>
            <Text style={{ color: "#000", fontSize: 16, fontWeight: "bold" }}>
              Fire Sensor Analog Value
            </Text>
            <LineChart
              animationEasing={"easeInOut"}
              areaChart
              startFillColor="#FF9B17"
              endFillColor="#FF9B17"
              startOpacity={0.4}
              endOpacity={0.01}
              initialSpacing={0}
              data={liveData.firePressure.slice(-20)}
              spacing={100}
              textColor="black"
              textShiftY={-8}
              textShiftX={-10}
              thickness={2}
              textFontSize={13}
              focusEnabled
              dataPointsColor="#EA7300"
              showStripOnFocus
              showTextOnFocus
              curved
              curveType={CurveType.QUADRATIC}
              // hideRules
              yAxisColor="#FF9B17"
              showVerticalLines
              verticalLinesColor="#FFA55D"
              xAxisColor="#FF9B17"
              color="#FF9B17"
              curvature={1}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingTop: 32,
    paddingHorizontal: 16,
    // borderWidth: 1,
  },
  content: {
    // flex: 1,
    gap: 16,
    // justifyContent: "center",
    alignItems: "center",
  },

  chartContainer: {
    width: "100%",
    minHeight: 300,
    gap: 20,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    paddingVertical: 16,
    borderColor: "#0BA5A4",
    overflow: "hidden",
    // borderWidth: 1,
  },
  announceContainer: {
    width: "100%",
    padding: 16,
  },
});
