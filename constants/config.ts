const API_URL = "";

const config = {
  WS: "ws://sample.com",
  CAMERA: "http://192.168.1.33:81/stream",
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default config;
