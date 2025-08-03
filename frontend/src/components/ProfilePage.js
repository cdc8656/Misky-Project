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
      setMessage(err.message || "Error en cargar perfil.");
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
      setMessage("Perfil actualizado!");
    } catch (err) {
      setMessage(err.message || "Error en actualizar perfil.");
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
      setMessage("Email/contraseña actualizado!");
    } catch (err) {
      setMessage(err.message || "Error en actualizar sus credenciales.");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      backgroundColor: "#fafafa",
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      padding: "max(env(safe-area-inset-top), 24px) 16px max(env(safe-area-inset-bottom), 24px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(135deg, #fafafa 0%, #f5f5f7 100%)",
    },

    card: {
      backgroundColor: "white",
      padding: "32px",
      borderRadius: "20px",
      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
      width: "100%",
      maxWidth: "500px",
      border: "1px solid rgba(255, 255, 255, 0.8)",
    },

    backButton: {
      backgroundColor: "#f3f4f6",
      color: "#374151",
      border: "none",
      padding: "12px 20px",
      borderRadius: "12px",
      cursor: "pointer",
      fontSize: "0.95rem",
      fontWeight: "600",
      marginBottom: "24px",
      transition: "all 0.2s ease",
      minHeight: "44px",
      width: "100%",
    },

    title: {
      color: "#1a1a1a",
      fontSize: "clamp(1.5rem, 4vw, 2rem)",
      fontWeight: "700",
      textAlign: "center",
      marginBottom: "32px",
      letterSpacing: "-0.02em",
    },

    tabContainer: {
      display: "flex",
      gap: "8px",
      marginBottom: "32px",
      backgroundColor: "#f3f4f6",
      padding: "4px",
      borderRadius: "12px",
    },

    tab: {
      flex: 1,
      padding: "12px 16px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "0.95rem",
      fontWeight: "600",
      transition: "all 0.2s ease",
      minHeight: "44px",
    },

    activeTab: {
      backgroundColor: "#3B38A0",
      color: "white",
      boxShadow: "0 2px 4px rgba(59, 56, 160, 0.3)",
    },

    inactiveTab: {
      backgroundColor: "transparent",
      color: "#6b7280",
    },

    message: {
      textAlign: "center",
      padding: "12px 20px",
      borderRadius: "12px",
      marginBottom: "24px",
      fontWeight: "500",
    },

    successMessage: {
      backgroundColor: "#ECFDF5",
      color: "#065F46",
      border: "1px solid #A7F3D0",
    },

    errorMessage: {
      backgroundColor: "#FEF2F2",
      color: "#DC2626",
      border: "1px solid #FCA5A5",
    },

    form: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },

    label: {
      display: "block",
      color: "#374151",
      fontSize: "0.95rem",
      fontWeight: "600",
      marginBottom: "8px",
    },

    input: {
      width: "100%",
      padding: "12px 16px",
      fontSize: "1rem",
      border: "2px solid #e5e7eb",
      borderRadius: "12px",
      backgroundColor: "white",
      transition: "all 0.2s ease",
      fontFamily: "inherit",
      minHeight: "20px",
    },

    button: {
      backgroundColor: "#3B38A0",
      color: "white",
      border: "none",
      padding: "16px 24px",
      borderRadius: "12px",
      cursor: "pointer",
      fontSize: "1rem",
      fontWeight: "600",
      transition: "all 0.2s ease",
      boxShadow: "0 4px 12px rgba(59, 56, 160, 0.3)",
      minHeight: "52px",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button
          onClick={() => navigate("/dashboard")}
          disabled={loading}
          style={styles.backButton}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#e5e7eb";
            e.target.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#f3f4f6";
            e.target.style.transform = "translateY(0)";
          }}
        >
          ← Volver al Panel
        </button>

        <h2 style={styles.title}>
          👤 Tu Perfil
        </h2>

        <div style={styles.tabContainer}>
          <button
            onClick={() => setActiveTab("info")}
            style={{
              ...styles.tab,
              ...(activeTab === "info" ? styles.activeTab : styles.inactiveTab),
            }}
          >
            Información Personal
          </button>
          <button
            onClick={() => setActiveTab("credentials")}
            style={{
              ...styles.tab,
              ...(activeTab === "credentials" ? styles.activeTab : styles.inactiveTab),
            }}
          >
            Cambiar Email/Contraseña
          </button>
        </div>

        {message && (
          <div
            style={{
              ...styles.message,
              ...(message.toLowerCase().includes("failed") ? styles.errorMessage : styles.successMessage)
            }}
          >
            {message}
          </div>
        )}

        {activeTab === "info" && (
          <form onSubmit={handleProfileChange} style={styles.form}>
            <div>
              <label style={styles.label}>Nombre</label>
              <input
                type="text"
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={styles.input}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3B38A0";
                  e.target.style.boxShadow = "0 0 0 3px rgba(59, 56, 160, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div>
              <label style={styles.label}>Ubicación</label>
              <input
                type="text"
                value={form.location || ""}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                style={styles.input}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3B38A0";
                  e.target.style.boxShadow = "0 0 0 3px rgba(59, 56, 160, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div>
              <label style={styles.label}>Contacto</label>
              <input
                type="text"
                value={form.contact || ""}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                style={styles.input}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3B38A0";
                  e.target.style.boxShadow = "0 0 0 3px rgba(59, 56, 160, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div>
              <label style={styles.label}>URL de Foto de Perfil</label>
              <input
                type="url"
                value={form.profile_picture || ""}
                onChange={(e) =>
                  setForm({ ...form, profile_picture: e.target.value })
                }
                style={styles.input}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3B38A0";
                  e.target.style.boxShadow = "0 0 0 3px rgba(59, 56, 160, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              style={{
                ...styles.button,
                opacity: loading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = "#5A56C4";
                  e.target.style.transform = "translateY(-1px)";
                  e.target.style.boxShadow = "0 6px 16px rgba(59, 56, 160, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#3B38A0";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(59, 56, 160, 0.3)";
              }}
            >
              {loading ? "Actualizando..." : "Actualizar Información"}
            </button>
          </form>
        )}

        {activeTab === "credentials" && (
          <form onSubmit={handleCredentialChange} style={styles.form}>
            <div>
              <label style={styles.label}>Nuevo Email</label>
              <input
                type="email"
                value={credForm.email}
                onChange={(e) =>
                  setCredForm({ ...credForm, email: e.target.value })
                }
                style={styles.input}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3B38A0";
                  e.target.style.boxShadow = "0 0 0 3px rgba(59, 56, 160, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div>
              <label style={styles.label}>Nueva Contraseña</label>
              <input
                type="password"
                value={credForm.password}
                onChange={(e) =>
                  setCredForm({ ...credForm, password: e.target.value })
                }
                style={styles.input}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3B38A0";
                  e.target.style.boxShadow = "0 0 0 3px rgba(59, 56, 160, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              style={{
                ...styles.button,
                opacity: loading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = "#5A56C4";
                  e.target.style.transform = "translateY(-1px)";
                  e.target.style.boxShadow = "0 6px 16px rgba(59, 56, 160, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#3B38A0";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(59, 56, 160, 0.3)";
              }}
            >
              {loading ? "Actualizando..." : "Cambiar Credenciales"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}