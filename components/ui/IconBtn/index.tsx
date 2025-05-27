import { Pressable } from "react-native";
import styles from "./styles";
import { useCallback, useState } from "react";

type IconBtnProps = {
    icon: React.ReactNode;
    onPress: () => void;
    onPressOut?: () => void;
    style?: object;
}

export default function IconBtn(
    { icon, onPress, onPressOut, style }: IconBtnProps
){
    const pressEvent = useCallback(() => {
        console.log("Icon button pressed");
        onPress();
    }, [onPress]);

    const pressOutEvent = useCallback(() => {
        if (onPressOut) {
            console.log("Icon button released");
            onPressOut();
        }
    }, [onPressOut]);

    return (
        <Pressable 
            style={[
                styles.btnContainer,
                style, // Add custom styles
            ]} 
            onPressIn={pressEvent}
            onPressOut={pressOutEvent}
        >
            {icon}
        </Pressable>        
    )
}