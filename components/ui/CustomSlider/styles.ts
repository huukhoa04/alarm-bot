import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    display: "flex",
    width: "100%",
    flexDirection: "column",
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
  },
  content: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  slider: {
    width: "100%",
    flexShrink: 1,
  },
});

export default styles;
