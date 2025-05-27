import { FontAwesome } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{}}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: () => <FontAwesome name="home" size={24} color="black" />,
        }}
      />
      <Tabs.Screen
        name="control"
        options={{
          headerShown: false,
          title: "Control",
          tabBarIcon: () => (
            <FontAwesome name="compass" size={24} color="black" />
          ),
        }}
      />
      <Tabs.Screen
        name="history/index"
        options={{
          title: "History",
          tabBarIcon: () => (
            <FontAwesome name="clock-o" size={24} color="black" />
          ),
        }}
      />
      <Tabs.Screen
        name="history/[id]"
        options={{
          title: "History",
          href: null,
          tabBarIcon: () => (
            <FontAwesome name="clock-o" size={24} color="black" />
          ),
        }}
      />
      <Tabs.Screen
        name="test"
        options={{
          title: "Test",
          tabBarIcon: () => (
            <FontAwesome name="expeditedssl" size={24} color="black" />
          ),
        }}
      />
    </Tabs>
  );
}
