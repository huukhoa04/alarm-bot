import { useCallback, useState } from "react";
import { Pressable } from "react-native";
import styles from "./styles";

type IconBtnProps = {
  icon: React.ReactNode;
  onPress: () => void;
  onStop: () => void; // Optional stop function
  style?: object;
};

export default function IconBtn({
  icon,
  onPress,
  onStop,
  style,
}: IconBtnProps) {
  const [pressed, setPressed] = useState(false);
  const startHolding = useCallback(() => {
      setPressed(true);
      onPress();
  }, [onPress]);
  const stopHolding = useCallback(() => {
      setPressed(false);
      onStop(); 
  }, [onStop]);

  return (
    <Pressable
      style={[
        styles.btnContainer,
        style, // Add custom styles
        pressed && styles.pressed, // Apply pressed style if button is pressed
      ]}
      onPressIn={startHolding}
      onPressOut={stopHolding}
    >
      {icon}
    </Pressable>
  );
}
