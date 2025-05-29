import { useCallback, useState, useRef, useEffect } from "react";
import { Pressable } from "react-native";
import styles from "./styles";

type IconBtnProps = {
  icon: React.ReactNode;
  onPress: () => void;
  onStop: () => void;
  style?: object;
  commandType?: string; // Add command type to track what command this button sends
};

export default function IconBtn({
  icon,
  onPress,
  onStop,
  style,
  commandType = "unknown",
}: IconBtnProps) {
  const [pressed, setPressed] = useState(false);
  const lastCommandTime = useRef<number>(0);
  const lastCommandType = useRef<string>("");

  const startHolding = useCallback(() => {
    setPressed(true);
    
    const now = Date.now();
    const timeSinceLastCommand = now - lastCommandTime.current;
    const isSameCommand = lastCommandType.current === commandType;
    
    // Send command if:
    // 1. Different command type (immediate)
    // 2. Same command but more than 2.5s has passed
    if (!isSameCommand || timeSinceLastCommand >= 2500) {
      onPress();
      lastCommandTime.current = now;
      lastCommandType.current = commandType;
      console.log(`Command sent: ${commandType} (${isSameCommand ? 'same after 2.5s' : 'different command'})`);
    } else {
      console.log(`Command blocked: ${commandType} (spam prevention, ${timeSinceLastCommand}ms ago)`);
    }
  }, [onPress, commandType]);

  const stopHolding = useCallback(() => {
    setPressed(false);
    
    // Always send stop command immediately (no spam protection for stop)
    onStop();
    lastCommandTime.current = Date.now();
    lastCommandType.current = "stop";
    console.log("Stop command sent");
  }, [onStop]);

  return (
    <Pressable
      style={[
        styles.btnContainer,
        style,
        pressed && styles.pressed,
      ]}
      onPressIn={startHolding}
      onPressOut={stopHolding}
    >
      {icon}
    </Pressable>
  );
}
