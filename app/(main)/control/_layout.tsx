import config from "@/constants/config";
import { WebSocketProvider } from "@/contexts/WsProvider";
import { Stack } from "expo-router";

export default function StackLayout() {
  return (
    <WebSocketProvider url={config.WS}>
      <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="stats" options={{ 
              headerShown: false,
              presentation: 'modal'
          }}/>
      </Stack>
    </WebSocketProvider>
  );
}