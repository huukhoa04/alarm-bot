import Toast from 'react-native-toast-message';

export function useToast() {
    const show = (message: string, type: "success" | "error" | "warning" | "info" = "info",
        offset: number = 50
    ) => {
        Toast.show({
        type,
        text1: message,
        position: "top",
        visibilityTime: 5000,
        autoHide: true,
        topOffset: offset,
        });
    };
    
    return { show };
}