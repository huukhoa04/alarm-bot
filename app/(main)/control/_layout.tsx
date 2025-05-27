import config from "@/constants/config";
import { WebSocketProvider } from "@/contexts/WsProvider";
import { FontAwesome } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";

export default function StackLayout() {
  const router = useRouter();
  return (
    <WebSocketProvider url={config.WS as string}>
      <Tabs
        screenOptions={{
          tabBarStyle: {
            display: "none",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ headerShown: true, title: "Control" }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: "Statistics",
            headerShown: true,
            headerLeft: () => (
              <FontAwesome
                name="chevron-left"
                size={24}
                color="blue"
                onPress={() => router.back()}
                style={{ marginLeft: 8 }}
              />
            ),
          }}
        />
      </Tabs>
    </WebSocketProvider>
  );
}
