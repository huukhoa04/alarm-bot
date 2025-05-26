import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowOpacity: 0.25,
    display: "flex",
    flexDirection: "row",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  content: {
    flexShrink: 1,
    display: "flex",
    flexDirection: "column",
    // borderWidth: 1,
  },
  icon: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: 56,
    height: 56,
    // borderWidth: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#666",
  },
});

export default styles;
