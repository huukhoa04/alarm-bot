import { useCallback, useRef, useState } from "react";
import { Pressable } from "react-native";
import styles from "./styles";

type IconBtnProps = {
  icon: React.ReactNode;
  onPress: () => void;
  style?: object;
};

export default function IconBtn({ icon, onPress, style }: IconBtnProps) {
  const intervalRef = useRef<number | null>(null);
  const [pressed, setPressed] = useState(false);
  const startHolding = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setPressed(true);
      onPress();
    }, 150); // Adjust the interval as needed
  }, []);
  const stopHolding = useCallback(() => {
    if (intervalRef.current) {
      setPressed(false);
      clearInterval(intervalRef.current);
      // intervalRef.current = null;
    }
  }, []);

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
