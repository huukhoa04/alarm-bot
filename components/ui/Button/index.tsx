import { Pressable, Text, View } from "react-native";
import styles from "./styles";
import { FontAwesome } from "@expo/vector-icons";

type ButtonProps = {
    title: string;
    onPress: () => void;
    style?: object;
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    iconPosition?: "left" | "right";
}

export default function Button(
    { 
        title, 
        onPress, 
        style = [], 
        disabled = false, 
        loading = false, 
        icon, 
        iconPosition = "left" 
    }: ButtonProps
){   
    return (
        <Pressable style={[styles.container, style]} onPress={onPress} disabled={disabled}>
            {icon && iconPosition === "left" && <View style={styles.icon}>{icon}</View>}
            {loading && <FontAwesome name="spinner" size={24} color="white" />}
            <Text style={styles.title}>{title}</Text>
            {icon && iconPosition === "right" && <View style={styles.icon}>{icon}</View>}
        </Pressable>
    )
}