import { View } from "react-native";
import styles from "./styles";
import IconBtn from "../IconBtn";
import { FontAwesome } from "@expo/vector-icons";

type ControlPanelProps = {
    controlEvent: {
        forward: () => void;
        back: () => void;
        left: () => void;
        right: () => void;
    }
    
}


export default function ControlPanel() {
    const icons = {
        left: <FontAwesome name="chevron-left" size={24} color="black" />,
        right: <FontAwesome name="chevron-right" size={24} color="black" />,
        forward: <FontAwesome name="chevron-up" size={24} color="black" />,
        back: <FontAwesome name="chevron-down" size={24} color="black" />,
    }
    return (
        <View 
        style={styles.container}
        >
            <View style={{
                width: "100%",
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
            }}>
                <IconBtn 
                    icon={icons.forward}
                    onPress={() => console.log("Forward")}
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
                    onPress={() => console.log("Left")}
                />
                <IconBtn 
                    icon={icons.right}
                    onPress={() => console.log("Right")}
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
                    onPress={() => console.log("Back")}
                />
            </View>
        </View>
    )
}