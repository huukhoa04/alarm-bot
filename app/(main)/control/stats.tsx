import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function StatsScreen() {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={{ color: "#000", fontSize: 24, fontWeight: "bold" }}>Stats</Text>
            <Text style={{ color: "#000", fontSize: 16, fontWeight: "bold" }}>Speed</Text>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#fff",
        paddingTop: 32,
    },
    content: {
        flex: 1,
        gap: 16,
        // justifyContent: "center",
        alignItems: "center",
    }

})