import { useWebSocket } from "@/contexts/WsProvider";
import { useToast } from "@/hooks/useToast";
import { toSensorItems } from "@/utils/mapSensorItems";
import { supabase } from "@/utils/supabase";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CurveType, LineChart } from "react-native-gifted-charts";

export default function StatsScreen() {
  const [lineData, setLineData] = useState<
    {
      value: number;
      dataPointText: string;
      label: string;
    }[]
  >([]);
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [flameDetected, setFlameDetected] = useState(false);
  const { socket, isConnected, error } = useWebSocket();

  const addToSupabase = async () => {
    if (lineData.length === 0) {
      toast.show("No data to add to Supabase.", "info");
      return;
    }
    const { data, error } = await supabase.from("sessions").insert([
      {
        stats: {
          temperature: toSensorItems(lineData),
          humidity: toSensorItems(lineData),
          gasPressure: toSensorItems(lineData),
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

        // Then handle our specific logic
        console.log("StatsScreen received:", event);
        try {
          const data = JSON.parse(event.data);
          if (data.flameDetected !== undefined) {
            setFlameDetected(data.flameDetected);
          }
        } catch (err) {
          console.error("Error parsing WebSocket data:", err);
        }
      };

      // Start data collection interval when connected
      interval = setInterval(() => {
        setLineData((prevData) => {
          const randomValue = Math.floor(Math.random() * 100);
          const newDataPoint = {
            value: randomValue,
            dataPointText: randomValue.toString() + "°C",
            label: new Date().toLocaleTimeString(),
          };

          return [...prevData, newDataPoint].slice(-20); // Keep last 20 data points
        });
      }, 2000);
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

  // Handle disconnection and data saving
  useEffect(() => {
    // Only save when we transition from connected to disconnected AND have data
    if (isConnected === false && lineData.length > 0) {
      console.log("WebSocket disconnected, saving data...");
      setFlameDetected(false);
      addToSupabase();
      // Clear data after a delay to ensure save completes
      setTimeout(() => {
        setLineData([]);
      }, 1000);
    }
  }, [isConnected]); // Remove lineData.length dependency to avoid infinite loops

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
              backgroundColor: flameDetected ? "#ffb3b3" : "#b3ffb3",
              borderColor: flameDetected ? "#ff0000" : "#009900",
              borderWidth: 2,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                color: flameDetected ? "#ff0000" : "#009900",
                fontSize: 20,
                fontWeight: "bold",
              }}
            >
              {flameDetected ? "🔥 Flame Detected!" : "✅ No Flame Detected"}
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
              data={lineData}
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
              data={lineData}
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
              Gas Concentration (ppm)
            </Text>
            <LineChart
              animationEasing={"easeInOut"}
              areaChart
              startFillColor="#FF9B17"
              endFillColor="#FF9B17"
              startOpacity={0.4}
              endOpacity={0.01}
              initialSpacing={0}
              data={lineData}
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
