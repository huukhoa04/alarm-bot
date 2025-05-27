import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  mainContainer: {
    alignItems: "center",
    gap: 20,
  },
  speedContainer: {
    width: 280,
    backgroundColor: "#f8f9fa",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  speedLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 10,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderThumb: {
    backgroundColor: "#4CAF50",
    width: 20,
    height: 20,
  },
  speedMinMax: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    minWidth: 25,
    textAlign: "center",
  },
  container: {
    position: "relative",
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 999,
    height: 200,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
