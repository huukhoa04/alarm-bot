import Button from "@/components/ui/Button";
import CustomSlider from "@/components/ui/CustomSlider";
import ASSETS from "@/constants/assets";
import { supabase } from "@/utils/supabase";
import { useAudioPlayer } from "expo-audio";
import { useState } from "react";
import { ScrollView, Text } from "react-native";

export default function TestScreen() {
  const [error, setError] = useState<any>(null);
  const [number, setNumber] = useState<number>(0);
  const player = useAudioPlayer(ASSETS.warning);
  const addNewItem = async () => {
    const randomNumber = (multiplier?: number) => {
      return Math.floor(Math.random() * (multiplier ?? 100));
    };
    const { data, error } = await supabase
      .from("sessions")
      .insert([
        {
          stats: {
            temperature: [
              {
                value: randomNumber(),
                dataPointText: randomNumber().toString(),
                timeStamp: new Date().toLocaleTimeString(),
              },
              {
                value: randomNumber(),
                dataPointText: randomNumber().toString(),
                timeStamp: new Date().toLocaleTimeString(),
              },
              {
                value: randomNumber(),
                dataPointText: randomNumber().toString(),
                timeStamp: new Date().toLocaleTimeString(),
              },
              {
                value: randomNumber(),
                dataPointText: randomNumber().toString(),
                timeStamp: new Date().toLocaleTimeString(),
              },
            ],
            humidity: [
              {
                value: randomNumber(),
                dataPointText: randomNumber().toString(),
                timeStamp: new Date().toLocaleTimeString(),
              },
              {
                value: randomNumber(),
                dataPointText: randomNumber().toString(),
                timeStamp: new Date().toLocaleTimeString(),
              },
              {
                value: randomNumber(),
                dataPointText: randomNumber().toString(),
                timeStamp: new Date().toLocaleTimeString(),
              },
              {
                value: randomNumber(),
                dataPointText: randomNumber().toString(),
                timeStamp: new Date().toLocaleTimeString(),
              },
            ],
            gasPressure: [
              {
                value: randomNumber(1337),
                dataPointText: randomNumber(1337).toString(),
                timeStamp: new Date().toLocaleTimeString(),
              },
              {
                value: randomNumber(1337),
                dataPointText: randomNumber(1337).toString(),
                timeStamp: new Date().toLocaleTimeString(),
              },
              {
                value: randomNumber(1337),
                dataPointText: randomNumber(1337).toString(),
                timeStamp: new Date().toLocaleTimeString(),
              },
              {
                value: randomNumber(1337),
                dataPointText: randomNumber(1337).toString(),
                timeStamp: new Date().toLocaleTimeString(),
              },
            ],
          },
        },
      ])
      .select();
    if (error) setError(error);
    console.log("New item added:", data);
  };
  return (
    <>
      <ScrollView
        contentContainerStyle={{
          display: "flex",
          gap: 8,
          paddingHorizontal: 16,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            textAlign: "left",
            marginVertical: 20,
            marginHorizontal: "auto",
          }}
        >
          Test Screen
        </Text>
        <Button
          title="Add new item"
          onPress={addNewItem}
          style={{
            backgroundColor: "#007AFF",
          }}
        />
        <Button
          title="Test Warning Sound"
          onPress={() => player.play()}
          style={{
            backgroundColor: "#ff0000",
          }}
        />
        <CustomSlider 
          value={number}
          label={"Speed"}
          onValueChange={(value) => setNumber(value)}
          minimumValue={0}
          maximumValue={150}
        />
        {error && (
          <Text style={{ color: "red", textAlign: "center", marginTop: 20 }}>
            Error: {error.message}
          </Text>
        )}
      </ScrollView>
    </>
  );
}
