import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 12,
    display: "flex",
    flexDirection: "row",
    backgroundColor: "#fff",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    borderRadius: 8,
  },
  icon: {
    width: 48,
    height: 48,
    overflow: "visible",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  content: {
    // width: "100%",
    display: "flex",
    flexShrink: 1,
    // borderColor: "#ccc",
    // borderWidth: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 16,
    // width: "100%",
    fontWeight: "bold",
    color: "#333",
  },
  description: {
    // width: "100%",
    fontSize: 14,
    color: "#666",
  },
});
export default styles;
