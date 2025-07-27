import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js"; // Supabase client

import ItemsList from "./components/ItemsList"; // Shows public food items (to be removed)
import RestaurantDashboard from "./components/RestaurantDashboard"; // Dashboard for restaurant users
import CustomerDashboard from "./components/CustomerDashboard"; // Dashboard for customers
import AuthForm from "./components/AuthForm"; // Handles login/signup

// grab Supabase Url and Supabase Public Anon Key from .env.local
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;  //points to unique Supabase project endpoint
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY; //allows the frontend to securely interact with the database within the limits of Row-Level Security (RLS)

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); // Initialize Supabase client

export default function App() {
  const [user, setUser] = useState(null);       // Supabase authenticated user
  const [profile, setProfile] = useState(null); // User profile from `profiles` table
  const [items, setItems] = useState([]);       // Public food items list
  const [loadingItems, setLoadingItems] = useState(true);
  const [errorItems, setErrorItems] = useState(null);

  // Fetch session and set auth listener
  useEffect(() => {
    async function fetchSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();  // Get current auth session
      setUser(session?.user ?? null);        // Set user if exists
    }

    fetchSession();

    // Set up real-time listener for login/logout events
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);  // Update user on login/logout
      setProfile(null);                // Reset profile (refetch)
    });

    return () => {
      listener.subscription.unsubscribe(); // Clean up listener
    };
  }, []);

  // Fetch user profile whenever user changes
  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setProfile(null);
        return;
      }

      // Get role, name, location, etc. from Supabase profiles table 
      const { data, error } = await supabase
        .from("profiles")
        .select("role, name, location, contact")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile", error);
        setProfile(null);
      } else {
        setProfile(data); // Set profile on success
      }
    }

    fetchProfile();
  }, [user]);

  // Fetch items (publicly available) once on mount and also when user logs out or changes
  useEffect(() => {
    async function fetchItems() {
      setLoadingItems(true);
      setErrorItems(null);

      const { data, error } = await supabase.from("items").select("*"); // Publicly visible food items
      if (error) {
        setErrorItems(error.message);
        setItems([]);
      } else {
        setItems(data);
      }
      setLoadingItems(false);
    }

    fetchItems();
  }, [user]); // Refetch items if user changes

  //Log out logic
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  // Conditional Render logic:

  // Not logged in: show AuthForm and public ItemsList with fetched items
  if (!user) {
    return (
      <div style={{ maxWidth: 600, margin: "2rem auto" }}>
        <h2>Login or Register</h2>
        <AuthForm onAuth={async () => {
          // After successful login/signup, refresh user and profile
          const {
            data: { session },
          } = await supabase.auth.getSession();
          setUser(session?.user ?? null);
        }} supabase={supabase} />

        <h3>Available Food Offers</h3>
        {loadingItems && <p>Loading food offers…</p>}
        {errorItems && <p style={{ color: "red" }}>Error: {errorItems}</p>}
        {!loadingItems && !errorItems && <ItemsList items={items} />}
      </div>
    );
  }

  // Logged in but profile is loading
  if (!profile) {
    return (
      <div style={{ maxWidth: 600, margin: "2rem auto" }}>
        <h2>Welcome, {user.email}</h2>
        <p>Loading profile…</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  // Logged in and profile loaded (show role specific dashboard)
  return (
    <div style={{ maxWidth: 600, margin: "2rem auto" }}>
      <h2>
        Welcome, {profile.name || user.email} ({profile.role})
      </h2>
      <button onClick={handleLogout}>Logout</button>

      {profile.role === "restaurant" && <RestaurantDashboard user={user} profile={profile} supabase={supabase} />}
      {profile.role === "customer" && <CustomerDashboard user={user} profile={profile} supabase={supabase} />}
    </div>
  );
}

//NOTES: Auth is handled fully by Supabase
//This file renders CustomerDashboard and RestaurantDashboard
//Backend is actually not called at all in this file (that happens in components)