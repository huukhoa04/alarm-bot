import { supabase } from "@/utils/supabase";
import { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";

export default function TestScreen() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const fetchData = async () => {
        setLoading(true);
        const data = await supabase.from("messages").select("*");
        console.log(data.data);
        setData(data);
    }
    useEffect(() => {
        fetchData();
        return () => {
            setLoading(false);
        }
    }, [])  
    return (
        <>
        <ScrollView>
            <Text
                style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    textAlign: "left",
                    marginVertical: 20,
                }}
            >Test Screen</Text>
            <Text>{
                !loading == false && JSON.stringify(data)
            }</Text>
        </ScrollView>
        </>
    )
}