import Button from "@/components/ui/Button";
import ControlPanel from "@/components/ui/ControlPanel";
import Loading from "@/components/ui/Loading";
import VideoFeed from "@/components/ui/VideoFeed";
import config from "@/constants/config";
import { useWebSocket } from "@/contexts/WsProvider";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function ControlScreen() {
  const {
    isConnected,
    sendMessage,
    error,
    connectWebSocket,
    reconnect,
    disconnect,
  } = useWebSocket();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const handleConnect = () => {
    if (isConnected) {
      console.log("Disconnecting from drone...");
      setLoading(true);
      setTimeout(() => {
        disconnect();
        setLoading(false);
      }, 2000);
      return;
    } else if (error) {
      console.log("Error occurred, attempting to reconnect...");
      setLoading(true);
      setTimeout(() => {
        reconnect();
        setLoading(false);
      }, 2000);
      return;
    } else {
      console.log("Connecting to drone...");
      setLoading(true);
      setTimeout(() => {
        connectWebSocket();
        setLoading(false);
      }, 2000);
      return;
    }
  };

  const controlEvent = useMemo(() => {
    return {
      forward: () => sendMessage("w"),
      back: () => sendMessage("s"),
      left: () => sendMessage("a"),
      right: () => sendMessage("d"),
    };
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
          <Text style={{ fontSize: 16, fontWeight: "bold", width: "100%", textAlign: "center", marginBottom: 16 }}>
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
