import Toast from 'react-native-toast-message';

export function useToast() {
    const show = (message: string, type: "success" | "error" | "info" = "info") => {
        Toast.show({
        type,
        text1: message,
        position: "top",
        visibilityTime: 3000,
        autoHide: true,
        });
    };
    
    return { show };
}