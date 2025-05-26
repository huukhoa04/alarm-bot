import { SessionItem } from "@/types/session";
import { dateFormat } from "@/utils/formatDate";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import styles from "./styles";

interface SessionCardProps {
  sessionItem: SessionItem
}

export default function SessionCard(
  { sessionItem }: SessionCardProps
) {
  const router = useRouter();
  return (
    <>
      <Pressable
        style={styles.container}
        onPress={() =>
          router.navigate({
            pathname: "/history/[id]",
            params: { id: sessionItem.id }, // Replace with actual session ID
          })
        } // Example ID, replace with actual session ID
      >
        <View style={styles.icon}>
          <FontAwesome name="line-chart" size={48} color="black" />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>
            <FontAwesome name="calendar" size={15} color="black" /> {dateFormat(sessionItem.created_at)}
          </Text>
          <Text style={styles.description}>
            This is a brief description of the session.
          </Text>
        </View>
      </Pressable>
    </>
  );
}
