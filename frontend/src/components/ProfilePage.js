import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import {
  fetchUserProfile,
  updateUserProfile,
} from "../api";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("info");
  const [profile, setProfile] = useState({});
  const [form, setForm] = useState({});
  const [credForm, setCredForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchProfile = async () => {
    setLoading(true);
    setMessage("");
    try {
      const data = await fetchUserProfile(supabase);
      setProfile(data);
      setForm(data);
    } catch (err) {
      setMessage(err.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await updateUserProfile(supabase, form);
      setMessage("Profile updated!");
    } catch (err) {
      setMessage(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      if (credForm.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: credForm.email,
        });
        if (emailError) throw emailError;
      }
      if (credForm.password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: credForm.password,
        });
        if (passwordError) throw passwordError;
      }
      setMessage("Email/password updated!");
    } catch (err) {
      setMessage(err.message || "Failed to update credentials.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "8px",
    marginTop: "4px",
    marginBottom: "12px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "14px",
  };

  const labelStyle = {
    display: "block",
    color: "#1A2A80",
    marginBottom: "6px",
  };

  const buttonStyle = {
    backgroundColor: "#3B38A0",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "5px",
    cursor: "pointer",
    width: "100%",
    marginTop: "12px",
  };

  return (
    <div
      style={{
        backgroundColor: "#B2B0E8",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "10px",
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
          width: "100%",
          maxWidth: "450px",
        }}
      >
        <button
          onClick={() => navigate("/dashboard")}
          disabled={loading}
          style={{
            ...buttonStyle,
            backgroundColor: "#ccc",
            color: "#333",
            marginBottom: "1rem",
          }}
        >
          ← Back to Dashboard
        </button>

        <h2 style={{ color: "#1A2A80", textAlign: "center", marginBottom: "1rem" }}>
          Your Profile
        </h2>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <button
            onClick={() => setActiveTab("info")}
            style={{
              ...buttonStyle,
              backgroundColor: activeTab === "info" ? "#3B38A0" : "#ddd",
              color: activeTab === "info" ? "#fff" : "#333",
            }}
          >
            Profile Info
          </button>
          <button
            onClick={() => setActiveTab("credentials")}
            style={{
              ...buttonStyle,
              backgroundColor: activeTab === "credentials" ? "#3B38A0" : "#ddd",
              color: activeTab === "credentials" ? "#fff" : "#333",
            }}
          >
            Change Email/Password
          </button>
        </div>

        {message && (
          <p
            style={{
              textAlign: "center",
              color: message.toLowerCase().includes("failed") ? "red" : "green",
              marginBottom: "1rem",
            }}
          >
            {message}
          </p>
        )}

        {activeTab === "info" && (
          <form onSubmit={handleProfileChange}>
            <label style={labelStyle}>Name</label>
            <input
              type="text"
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={inputStyle}
            />

            <label style={labelStyle}>Location</label>
            <input
              type="text"
              value={form.location || ""}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              style={inputStyle}
            />

            <label style={labelStyle}>Contact</label>
            <input
              type="text"
              value={form.contact || ""}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              style={inputStyle}
            />

            <label style={labelStyle}>Profile Picture URL</label>
            <input
              type="text"
              value={form.profile_picture || ""}
              onChange={(e) =>
                setForm({ ...form, profile_picture: e.target.value })
              }
              style={inputStyle}
            />

            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? "Updating..." : "Update Info"}
            </button>
          </form>
        )}

        {activeTab === "credentials" && (
          <form onSubmit={handleCredentialChange}>
            <label style={labelStyle}>New Email</label>
            <input
              type="email"
              value={credForm.email}
              onChange={(e) =>
                setCredForm({ ...credForm, email: e.target.value })
              }
              style={inputStyle}
            />

            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              value={credForm.password}
              onChange={(e) =>
                setCredForm({ ...credForm, password: e.target.value })
              }
              style={inputStyle}
            />

            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? "Updating..." : "Change Credentials"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
