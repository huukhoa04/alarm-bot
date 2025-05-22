import { Pressable } from "react-native";
import styles from "./styles";
import { useCallback, useState } from "react";

type IconBtnProps = {
    icon: React.ReactNode;
    onPress: () => void;
    style?: object;
}

export default function IconBtn(
    { icon, onPress, style }: IconBtnProps
){
    const pressEvent = useCallback(() => {
        console.log("Icon button pressed");
        onPress();
    }, [])
    return (
        <Pressable style={[
            styles.btnContainer,
            style, // Add custom styles
        ]} onPress={pressEvent}

        >
            {icon}
        </Pressable>        
    )
}