import ControlPanel from "@/components/ui/ControlPanel";
import { ScrollView, StyleSheet } from "react-native";

export default function ControlScreen() {
    return(
        <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
        >
            <ControlPanel />
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: "#fff",
    },
    content: {
        padding: 16,
        alignItems: "center",
    },
});