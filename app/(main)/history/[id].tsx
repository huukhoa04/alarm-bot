import { SessionItem } from "@/types/session";
import { getDate, getTime } from "@/utils/formatDate";
import { mapSensorItems } from "@/utils/mapSensorItems";
import { supabase } from "@/utils/supabase";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CurveType, LineChart } from "react-native-gifted-charts";

export default function SessionDetail() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<SessionItem | null>(null);
  
  const fetchData = async () => {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      console.error("Error fetching session data:", error);
      setError(error);
      return;
    }
    setData(data);
  };
  const onRefresh = useCallback(async () => {
    setLoading(true);

    await fetchData();
    setLoading(false);
  }, [fetchData]);

  useEffect(() => {
    setLoading(true);

    fetchData();
    setLoading(false);
  }, [fetchData]);

  

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            colors={["#007AFF"]} // Android
            tintColor="#007AFF" // iOS
          />
        }
      >
        {error && (
          <Text style={{ color: "red", textAlign: "center", marginTop: 20 }}>
            Error fetching session data: {error.message}
          </Text>
        )}
        {loading === false && data !== null && (
          <>
            <Text style={{ color: "#000", fontSize: 16, fontWeight: "bold" }}>
              Saved at: {getDate(data.created_at)} - {getTime(data.created_at)}
            </Text>
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
                data={mapSensorItems(data.stats.temperature)}
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
                // maxValue={100}
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
                data={mapSensorItems(data.stats.humidity)}
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
                // maxValue={100}
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
                data={mapSensorItems(data.stats.gasPressure)}
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
                data={mapSensorItems(data.stats.firePressure)}
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
    </>
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
