import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

import ItemsList from "./components/ItemsList";
import RestaurantDashboard from "./components/RestaurantDashboard";
import CustomerDashboard from "./components/CustomerDashboard";
import AuthForm from "./components/AuthForm";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [errorItems, setErrorItems] = useState(null);

  // Fetch session and set auth listener
  useEffect(() => {
    async function fetchSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    }

    fetchSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setProfile(null); // Reset profile to reload on user change
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Fetch user profile whenever user changes
  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role, name, location, contact")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile", error);
        setProfile(null);
      } else {
        setProfile(data);
      }
    }

    fetchProfile();
  }, [user]);

  // Fetch items (publicly available) once on mount and also when user logs out or changes
  useEffect(() => {
    async function fetchItems() {
      setLoadingItems(true);
      setErrorItems(null);

      const { data, error } = await supabase.from("items").select("*");
      if (error) {
        setErrorItems(error.message);
        setItems([]);
      } else {
        setItems(data);
      }
      setLoadingItems(false);
    }

    fetchItems();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  // Render logic:

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

  // Logged in and profile loaded
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
