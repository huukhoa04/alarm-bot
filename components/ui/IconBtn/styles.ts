import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  btnContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
  },
  pressed: {
    opacity: 0.7,
    backgroundColor: "gray",
  },
});

export default styles;
