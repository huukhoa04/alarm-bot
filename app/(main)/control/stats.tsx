import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CurveType, LineChart } from "react-native-gifted-charts";

export default function StatsScreen() {
  const [lineData, setLineData] = useState([
    { value: 0, dataPointText: "0" },
    { value: 20, dataPointText: "20" },
    { value: 18, dataPointText: "18" },
    { value: 40, dataPointText: "40" },
    { value: 36, dataPointText: "36" },
    { value: 60, dataPointText: "60" },
    { value: 54, dataPointText: "54" },
    { value: 85, dataPointText: "85" },
    { value: 70, dataPointText: "70" },
    { value: 90, dataPointText: "90" },
  ]);
  const [loading, setLoading] = useState(false);
  const [flameDetected, setFlameDetected] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setLineData((prevData) => {
        const randomValue = Math.floor(Math.random() * 100);
        const newDataPoint = {
          value: randomValue,
          dataPointText: randomValue.toString(),
        };

        return [...prevData, newDataPoint].slice(-10); // Keep only the last 15 data points
      });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={{ color: "#000", fontSize: 28, fontWeight: "bold" }}>
        Live Statistic
      </Text>
    <Text style={{ color: "#000", fontSize: 12 }}>
        The statistics below are updated every 2 seconds with random values.
        This is a simulation of real-time data.
    </Text>
    <View style={{
        ...styles.announceContainer,
        backgroundColor: flameDetected ? "#ffb3b3" : "#b3ffb3",
        borderColor: flameDetected ? "#ff0000" : "#009900",
        borderWidth: 2,
        borderRadius: 12,
    }}>
      <Text style={{ color: flameDetected ? "#ff0000" : "#009900"
        , fontSize: 20, fontWeight: "bold" }}>
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
        spacing={30}
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
        hideRules
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
        spacing={30}
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
        hideRules
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
        spacing={30}
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
        hideRules
        yAxisColor="#FF9B17"
        showVerticalLines
        verticalLinesColor="#FFA55D"
        xAxisColor="#FF9B17"
        color="#FF9B17"
        curvature={1}
      />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingTop: 32,
    paddingHorizontal: 16,
    borderWidth: 1,
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
  }
});
