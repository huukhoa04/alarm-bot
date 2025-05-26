import SessionCard from "@/components/ui/SessionCard";
import { SessionItem } from "@/types/session";
import { supabase } from "@/utils/supabase";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text } from "react-native";

export default function HistoryScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<SessionItem[]>([]);
  const fetchHistoryData = useCallback(async () => {
    let { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error("Error fetching history data:", error);
      setError(error);
      return;
    }
    setData(sessions || []);

  }, []);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchHistoryData();
      setLoading(false);
    };
    fetchData();
  }, []);

  const onRefresh = useCallback(async () => {
    setLoading(true);
    await fetchHistoryData();
    setLoading(false);
  }, []);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            colors={["#007AFF"]} // Android
            tintColor="#007AFF" // iOS
          />
        }
      >
        {
          loading === false && 
          <>
            {error && (
              <Text style={{ color: "red", textAlign: "center", marginTop: 20 }}>
                Error fetching history data: {error.message}
              </Text>
            )}
            {data.length > 0 ? (
              data.map((sessionItem) => (
                <SessionCard key={sessionItem.id} sessionItem={sessionItem} />
              ))
            ) : (
              <Text style={{ textAlign: "center", marginTop: 20 }}>
                No history data available.
              </Text>
            )}
          </>
        }
              
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: "#f8f9fa",
  },
  content: {
    gap: 8,
    display: "flex",
    flexDirection: "column",
  },
});
