import Slider from "@react-native-community/slider";
import { Text, View } from "react-native";
import styles from "./styles";

type CustomSliderProps = {
    label?: string;
    value?: number;
    onValueChange?: (value: number) => void;
    onSlidingComplete?: (value: number) => void;    
    minimumValue?: number;
    maximumValue?: number;
    minimumTrackTintColor?: string;
    maximumTrackTintColor?: string;
}

export default function CustomSlider(
    {
        label = "Label",
        value = 0,
        onValueChange = (value: number) => console.log(value),
        onSlidingComplete = (value: number) => console.log("Sliding complete:", value),
        minimumValue = 0,
        maximumValue = 1,
        minimumTrackTintColor = "#FFFFFF",
        maximumTrackTintColor = "#000000"
    }: CustomSliderProps
){
    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.content}>
                <Slider
                    style={styles.slider}
                    value={value}
                    onValueChange={onValueChange}
                    onSlidingComplete={onSlidingComplete}
                    step={1}
                    minimumValue={minimumValue}
                    maximumValue={maximumValue}
                    minimumTrackTintColor={minimumTrackTintColor}
                    maximumTrackTintColor={maximumTrackTintColor}
                />
                <Text style={{
                    ...styles.label,
                }}>{value}</Text>
            </View>
        </View>
    )
}