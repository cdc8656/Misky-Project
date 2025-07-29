import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // import useNavigate
import { supabase } from "./supabaseClient";
import {
  fetchUserProfile,
  updateUserProfile,
  changeUserCredentials,
} from "../api";

export default function ProfilePage() {
  const navigate = useNavigate(); // initialize navigate
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
      console.error(err);
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
      console.error(err);
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
        // Update email directly with Supabase
        const { error: emailError } = await supabase.auth.updateUser({
            email: credForm.email,
        });
        if (emailError) throw emailError;
        }

        if (credForm.password) {
        // Update password directly with Supabase
        const { error: passwordError } = await supabase.auth.updateUser({
            password: credForm.password,
        });
        if (passwordError) throw passwordError;
        }

        setMessage("Email/password updated!");
    } catch (err) {
        setMessage(err.message || "Failed to update credentials.");
        console.error(err);
    } finally {
        setLoading(false);
    }
    };

  return (
    <div className="max-w-xl mx-auto p-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>

      <div className="flex mb-4 space-x-4">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "info" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("info")}
        >
          Profile Info
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "credentials"
              ? "bg-blue-500 text-white"
              : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("credentials")}
        >
          Change Email/Password
        </button>
      </div>

      {message && <p className="mb-4 text-red-500">{message}</p>}

      {activeTab === "info" && (
        <form onSubmit={handleProfileChange} className="space-y-4">
          <div>
            <label className="block">Name</label>
            <input
              type="text"
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border px-3 py-2"
            />
          </div>
          <div>
            <label className="block">Location</label>
            <input
              type="text"
              value={form.location || ""}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full border px-3 py-2"
            />
          </div>
          <div>
            <label className="block">Contact</label>
            <input
              type="text"
              value={form.contact || ""}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              className="w-full border px-3 py-2"
            />
          </div>
          <div>
            <label className="block">Profile Picture URL</label>
            <input
              type="text"
              value={form.profile_picture || ""}
              onChange={(e) =>
                setForm({ ...form, profile_picture: e.target.value })
              }
              className="w-full border px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {loading ? "Updating..." : "Update Info"}
          </button>
        </form>
      )}

      {activeTab === "credentials" && (
        <form onSubmit={handleCredentialChange} className="space-y-4">
          <div>
            <label className="block">New Email</label>
            <input
              type="email"
              value={credForm.email}
              onChange={(e) => setCredForm({ ...credForm, email: e.target.value })}
              className="w-full border px-3 py-2"
            />
          </div>
          <div>
            <label className="block">New Password</label>
            <input
              type="password"
              value={credForm.password}
              onChange={(e) =>
                setCredForm({ ...credForm, password: e.target.value })
              }
              className="w-full border px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-yellow-600 text-white px-4 py-2 rounded"
          >
            {loading ? "Updating..." : "Change Credentials"}
          </button>
        </form>
      )}
    </div>
  );
}
