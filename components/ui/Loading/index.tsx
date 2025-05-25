import { ActivityIndicator } from "react-native";

export default function Loading() {
    return (
        <ActivityIndicator 
            size="large" 
            color="#00ff00" 
            style={{ 
                flex: 1, 
                // borderWidth: 1,
                justifyContent: "center", 
                alignItems: "center" 
            }}
        />
    )
}