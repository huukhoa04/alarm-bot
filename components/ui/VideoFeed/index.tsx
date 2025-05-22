import { useVideoPlayer, VideoView } from "expo-video";
import { View } from "react-native";
import { WebView } from 'react-native-webview';


type VideoFeedProps = {
    videoFeed: string | any;
}


export default function VideoFeed(
    { videoFeed }: VideoFeedProps
) {
    // const player = useVideoPlayer(videoFeed, player => {
    //     player.loop = true;
    //     player.play();
    // });
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
            <WebView
                style={{
                    width: 300,
                    height: 200,
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
                source={{
                    uri: videoFeed,
                }}
            />
            
        </>
    )
}