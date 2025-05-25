import Button from "@/components/ui/Button";
import ControlPanel from "@/components/ui/ControlPanel";
import Loading from "@/components/ui/Loading";
import VideoFeed from "@/components/ui/VideoFeed";
import config from "@/constants/config";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";

export default function ControlScreen() {
    const [loading, setLoading] = useState(false);
    const [connected, setConnected] = useState(false);
    const router = useRouter();
    const handleConnect = () => {
        if (connected) {
            console.log("Disconnecting from drone...");
            setLoading(true);
            // Simulate a disconnection delay
            setTimeout(() => {
                console.log("Disconnected from drone");
                setConnected(false);
                setLoading(false);
            }, 2000);
            return;
        }
        else {
            console.log("Connecting to drone...");
            setLoading(true);
            // Simulate a connection delay
            setTimeout(() => {
                console.log("Connected to drone");
                setConnected(true);
                setLoading(false);
            }, 2000);
        }
    }


    return(
        <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
        >
            {loading && <Loading />}
            
            {
                connected &&
                <>
                    <VideoFeed 
                        videoFeed={config.CAMERA}
                    />
                    <ControlPanel />
                </>
            }
            <Button 
                title={connected ? "Disconnect" : "Connect to Mini Car"}
                onPress={handleConnect}
                loading={loading}
                disabled={loading}
                style={{ backgroundColor: connected ? '#f00' : '#0f0' }}
            />
            <Button 
                title="Open Stats Modal"
                onPress={() => router.push("/control/stats")}
                style={{ backgroundColor: '#00f' }}
            />
        </ScrollView>
    )
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
});