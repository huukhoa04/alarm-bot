import { useState, useEffect } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";

type VideoFeedProps = {
  videoFeed: string | any;
  capture?: () => void;
};

export default function VideoFeed({
  videoFeed,
  capture = () => {
    console.log("Capture button pressed");
  },
}: VideoFeedProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-refresh every 30 seconds to maintain stream stability
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleError = () => {
    // Auto-retry after 2 seconds
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 2000);
  };

  return (
    <View
      style={{
        position: "relative",
        width: "100%",
        height: 200,
        borderRadius: 8,
        backgroundColor: "#000",
      }}
    >
      <WebView
        key={refreshKey} // Force refresh when key changes
        style={{
          borderRadius: 8,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          backgroundColor: "#000",
        }}
        source={{
          uri: videoFeed,
        }}
        onError={handleError}
        // Optimized settings for ESP32 camera stream
        javaScriptEnabled={false}
        domStorageEnabled={false}
        cacheEnabled={false}
        incognito={true}
        // Reduce memory usage
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        // Handle network errors gracefully
        onHttpError={(syntheticEvent) => {
          console.warn('Camera HTTP Error:', syntheticEvent.nativeEvent);
          handleError();
        }}
      />
    </View>
  );
}
