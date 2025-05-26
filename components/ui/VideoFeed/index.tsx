import { View } from "react-native";
import { WebView } from "react-native-webview";

type VideoFeedProps = {
  videoFeed: string | any;
  capture?: () => void;
};

export default function VideoFeed(
  { 
    videoFeed, 
    capture = () => {
      console.log("Capture button pressed");
    } 
  }: VideoFeedProps) {
  const handleCapture = () => {
    console.log("Capture button pressed");
    capture();
  }
  return (
    <>
      {/* <VideoView
                player={player}
                style={{
                    width: "100%",
                    height: 300,
                    borderRadius: 8,
                    borderColor: "#000",
                    borderWidth: 1,
                    shadowColor: "#000",
                    shadowOffset: {
                        width: 0,
                        height: 2,
                    },
                    backgroundColor: "#000",
                }}
            /> */}
      <View
        style={{
          position: 'relative',
          // width: "auto",
          width: "100%",
          height: 200,
          borderRadius: 8,
        }}
      >
        {/* <Pressable style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              zIndex: 1,
              borderWidth: 1,
              backgroundColor: '#fff',
              padding: 8,
              borderRadius: 50,
            }}
          onPress={handleCapture}
            >
          <FontAwesome 
            name="camera"
            size={24}
            color="black"
          />
        </Pressable> */}

        <WebView
          style={{
            borderRadius: 8,
            borderColor: "#f00",
            // borderWidth: 1,
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
        />
      </View>
    </>
  );
}
