import { View, Text } from "react-native";
import Slider from '@react-native-community/slider';
import styles from "./styles";
import IconBtn from "../IconBtn";
import { FontAwesome } from "@expo/vector-icons";

type ControlPanelProps = {
    controlEvent?: {
        forward: () => void;
        back: () => void;
        left: () => void;
        right: () => void;
        stop: () => void;
    };
    onSpeedChange?: (speed: number) => void;
    currentSpeed?: number;
}

export default function ControlPanel(
    { 
        controlEvent = {
            forward: () => console.log("Forward"),
            back: () => console.log("Back"),
            left: () => console.log("Left"),
            right: () => console.log("Right"),
            stop: () => console.log("Stop"),
        },
        onSpeedChange = (speed: number) => console.log("Speed:", speed),
        currentSpeed = 100
 }: ControlPanelProps
) {
    const icons = {
        left: <FontAwesome name="chevron-left" size={24} color="black" />,
        right: <FontAwesome name="chevron-right" size={24} color="black" />,
        forward: <FontAwesome name="chevron-up" size={24} color="black" />,
        back: <FontAwesome name="chevron-down" size={24} color="black" />,
    }

    return (
        <View style={styles.mainContainer}>
            {/* Speed Control Section */}
            <View style={styles.speedContainer}>
                <Text style={styles.speedLabel}>🚀 Tốc độ: {currentSpeed}</Text>
                <View style={styles.sliderContainer}>
                    <Text style={styles.speedMinMax}>50</Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={50}
                        maximumValue={150}
                        value={currentSpeed}
                        onValueChange={onSpeedChange}
                        step={10}
                        minimumTrackTintColor="#4CAF50"
                        maximumTrackTintColor="#ddd"
                        thumbStyle={styles.sliderThumb}
                    />
                    <Text style={styles.speedMinMax}>150</Text>
                </View>
            </View>

            {/* Direction Control Section */}
            <View style={styles.container}>
                <View style={{
                    width: "100%",
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                }}>
                    <IconBtn 
                        icon={icons.forward}
                        onPress={controlEvent.forward}
                        onPressOut={controlEvent.stop}
                    />
                </View>
                <View style={{
                    width: "100%",
                    flex: 1,
                    flexDirection: "row",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingHorizontal: 8,
                }}>
                    <IconBtn 
                        icon={icons.left}
                        onPress={controlEvent.left}
                        onPressOut={controlEvent.stop}
                    />
                    <IconBtn 
                        icon={icons.right}
                        onPress={controlEvent.right}
                        onPressOut={controlEvent.stop}
                    />
                </View>
                
                <View style={{
                    width: "100%",
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                    <IconBtn 
                        icon={icons.back}
                        onPress={controlEvent.back}
                        onPressOut={controlEvent.stop}
                    />
                </View>
            </View>
        </View>
    )
}