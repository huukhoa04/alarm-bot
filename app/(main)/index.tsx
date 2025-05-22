import Option from "@/components/ui/Option";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
    const router = useRouter();
    const handleNavigate = (route: any) => {
        router.push(route);
    }
    return(
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={{ 
                fontSize: 24, 
                fontWeight: "bold",
                width: "100%",
                marginBottom: 16,
                
            }}>Welcome Back</Text>
            <Option 
                title="Control"
                description="Control the mini car"
                icon={<FontAwesome name="home" size={48} color="black" />}
                onPress={() => handleNavigate("control")}
            />
            <Option 
                title="History"
                description="Review your past sessions"
                icon={<FontAwesome name="clock-o" size={48} color="black" />}
                onPress={() => handleNavigate("history")}
            />
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingTop: 16,
        paddingHorizontal: 16,
        
    },
    contentContainer : {
        display: "flex",
        gap: 8,
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center",
    }
});