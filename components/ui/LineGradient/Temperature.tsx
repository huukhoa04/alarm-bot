import { LinearGradient, Stop } from "react-native-svg";

export default function Temperature() {
  return (
    <LinearGradient id="ggrd" x1="0" y1="0" x2="0" y2="1">
      <Stop offset="0" stopColor={"red"} />
      <Stop offset="0.5" stopColor={"orange"} />
      <Stop offset="1" stopColor={"green"} />
    </LinearGradient>
  );
}
