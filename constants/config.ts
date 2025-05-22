const API_URL = "";

const config = {
  WS: "",
  CAMERA: "http://192.168.1.44:81/stream",
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default config;
