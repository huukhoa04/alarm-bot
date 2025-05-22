import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import config from "@/constants/config";

const supabaseUrl = config.supabase.url;
const supabaseAnonKey = config.supabase.anonKey;

export const supabase = createClient(
  supabaseUrl as string,
  supabaseAnonKey as string,
  {
    auth: {
      persistSession: false,
    },
  }
);
