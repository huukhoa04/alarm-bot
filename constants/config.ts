const config = {
  WS: process.env.EXPO_PUBLIC_WEBSOCKET,
  CAMERA: process.env.EXPO_PUBLIC_CAMERA_URL,
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default config;
