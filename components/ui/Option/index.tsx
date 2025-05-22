import { Pressable, Text, View } from "react-native";
import styles from "./styles";

type OptionProps = {
    title: string;
    description: string;
    icon: React.ReactNode;
    onPress: () => void;
}


export default function Option(
    { title, description, icon, onPress }: OptionProps
) {
    return (
        <Pressable onPress={onPress} style={styles.container}>
            <View style={styles.icon}>
                {icon}
            </View>
            <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
            </View>
        </Pressable>
    )
}