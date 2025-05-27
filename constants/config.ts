const API_URL = "";

const config = {
  WS: "ws://192.168.1.14:4444",
  CAMERA: "http://192.168.1.14:5555/stream",
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default config;
