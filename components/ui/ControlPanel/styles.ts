import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 999,
    height: 200,
  },
  left: {
    position: "absolute",
    left: 0,
    top: "38%",
  },
  right: {
    position: "absolute",
    right: 0,
    top: "38%",
  },
  forward: {
    position: "absolute",
    top: 0,
    left: "38%",
  },
  back: {
    position: "absolute",
    bottom: 0,
    left: "38%",
  },
});

export default styles;
