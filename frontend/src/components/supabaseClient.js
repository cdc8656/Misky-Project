// supabaseClient.js
import { createClient } from "@supabase/supabase-js"; //createClient from the Supabase JavaScript SDK. This function is used to create a connection to your Supabase backend.

// grab Supabase Url and Supabase Public Anon Key from .env.local
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL; //points to unique Supabase project endpoint
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY; //allows the frontend to securely interact with the database within the limits of Row-Level Security (RLS)

//Creates and exports the Supabase client instance using the provided URL and anon key
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 
