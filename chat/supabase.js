import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gersizuqszcizmkmncas.supabase.co";

const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlcnNpenVxc3pjaXpta21uY2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNTMzNTQsImV4cCI6MjA5MzgyOTM1NH0.bDE4ds2OHlC8RBJaBMlRJsf2T6d3sGtlTrYoo3gaOa8";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
