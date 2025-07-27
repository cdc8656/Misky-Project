// src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

import RestaurantDashboard from "./components/RestaurantDashboard";
import CustomerDashboard from "./components/CustomerDashboard";
import AuthForm from "./components/AuthForm";
import HomePage from "./components/HomePage";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

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
      setProfile(null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const handleAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" />
            ) : (
              <AuthForm type="login" supabase={supabase} onAuth={handleAuth} />
            )
          }
        />

        <Route
          path="/register"
          element={
            user ? (
              <Navigate to="/dashboard" />
            ) : (
              <AuthForm type="register" supabase={supabase} onAuth={handleAuth} />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            user && profile ? (
              profile.role === "restaurant" ? (
                <RestaurantDashboard user={user} profile={profile} supabase={supabase} />
              ) : (
                <CustomerDashboard user={user} profile={profile} supabase={supabase} />
              )
            ) : user ? (
              <p style={{ textAlign: "center", marginTop: "2rem" }}>Loading profile...</p>
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {user && (
        <div style={{ position: "fixed", top: 10, right: 20 }}>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </Router>
  );
}