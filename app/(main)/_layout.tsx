import { FontAwesome } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs>
        <Tabs.Screen
            name="index"
            options={{
            title: "Home",
            tabBarIcon: () => (<FontAwesome name="home" size={24} color="black" />),
         }}
        />
        <Tabs.Screen
            name="control"
            options={{
            title: "Control",
            tabBarIcon: () => (<FontAwesome name="compass" size={24} color="black" />),
            }}
        />
        <Tabs.Screen
            name="history"
            options={{
            title: "History",
            tabBarIcon: () => (<FontAwesome name="clock-o" size={24} color="black" />),
            }}
        />
        <Tabs.Screen
            name="test"
            options={{
            title: "Test",
            tabBarIcon: () => (<FontAwesome name="expeditedssl" size={24} color="black" />),
            }}
        />
    </Tabs>
  );
}