import { FontAwesome } from "@expo/vector-icons";
import { Text, View } from "react-native";
import IconBtn from "../IconBtn";
import styles from "./styles";

type ControlPanelProps = {
  controlEvent?: {
    forward: () => void;
    back: () => void;
    left: () => void;
    right: () => void;
  };
};

export default function ControlPanel({
  controlEvent = {
    forward: () => console.log("Forward"),
    back: () => console.log("Back"),
    left: () => console.log("Left"),
    right: () => console.log("Right"),
  },
}: ControlPanelProps) {
  const icons = {
    left: <FontAwesome name="chevron-left" size={24} color="black" />,
    right: <FontAwesome name="chevron-right" size={24} color="black" />,
    forward: <FontAwesome name="chevron-up" size={24} color="black" />,
    back: <FontAwesome name="chevron-down" size={24} color="black" />,
  };
  return (
    <View style={styles.container}>
      <View
        style={{
          width: "100%",
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <IconBtn icon={icons.forward} onPress={controlEvent.forward} />
      </View>
      <View
        style={{
          width: "100%",
          flex: 1,
          flexDirection: "row",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 8,
        }}
      >
        <IconBtn icon={icons.left} onPress={controlEvent.left} />
        <IconBtn icon={icons.right} onPress={controlEvent.right} />
      </View>

      <View
        style={{
          width: "100%",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconBtn icon={icons.back} onPress={controlEvent.back} />
      </View>
    </View>
  );
}
