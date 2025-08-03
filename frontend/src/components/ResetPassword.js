import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function getHashParams() {
  const hash = window.location.hash.substring(1); // remove leading #
  const params = new URLSearchParams(hash);
  return Object.fromEntries(params.entries());
}

export default function ResetPassword({ supabase }) {
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  useEffect(() => {
    const params = getHashParams();
    const at = params.access_token;
    const rt = params.refresh_token;

    if (at && rt) {
      setAccessToken(at);
      setRefreshToken(rt);
    } else {
      setErrorMsg("Missing access or refresh token in URL.");
    }
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        setErrorMsg(`Failed to set session: ${sessionError.message}`);
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setErrorMsg(updateError.message);
      } else {
        setSuccessMsg("Password successfully reset! You can now log in.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Unexpected error during password reset.");
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
      maxWidth: "450px",
      border: "1px solid rgba(255, 255, 255, 0.8)",
    },

    title: {
      color: "#1a1a1a",
      fontSize: "clamp(1.5rem, 4vw, 2rem)",
      fontWeight: "700",
      textAlign: "center",
      marginBottom: "32px",
      letterSpacing: "-0.02em",
    },

    message: {
      padding: "16px 20px",
      borderRadius: "12px",
      marginBottom: "24px",
      fontWeight: "500",
      textAlign: "center",
    },

    errorMessage: {
      backgroundColor: "#FEF2F2",
      color: "#DC2626",
      border: "1px solid #FCA5A5",
    },

    successMessage: {
      backgroundColor: "#ECFDF5",
      color: "#065F46",
      border: "1px solid #A7F3D0",
    },

    form: {
      display: "flex",
      flexDirection: "column",
      gap: "24px",
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

    buttonSmall: {
      backgroundColor: "#3B38A0",
      color: "white",
      border: "none",
      padding: "12px 20px",
      borderRadius: "12px",
      cursor: "pointer",
      fontSize: "0.95rem",
      fontWeight: "600",
      transition: "all 0.2s ease",
      boxShadow: "0 2px 8px rgba(59, 56, 160, 0.3)",
      minHeight: "44px",
      marginTop: "16px",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>
          🔐 Restablecer Contraseña
        </h2>

        {errorMsg && (
          <div style={{...styles.message, ...styles.errorMessage}}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{...styles.message, ...styles.successMessage}}>
            <p style={{ margin: "0 0 16px 0" }}>¡Contraseña restablecida exitosamente! Ya puedes iniciar sesión.</p>
            <button
              onClick={() => navigate("/login")}
              style={styles.buttonSmall}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#5A56C4";
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 4px 12px rgba(59, 56, 160, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#3B38A0";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 2px 8px rgba(59, 56, 160, 0.3)";
              }}
            >
              Ir a Iniciar Sesión
            </button>
          </div>
        )}

        {!successMsg && accessToken && refreshToken && (
          <form onSubmit={handleResetPassword} style={styles.form}>
            <div>
              <label htmlFor="new-password" style={styles.label}>
                Nueva Contraseña
              </label>
              <input
                id="new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                minLength={6}
                autoComplete="new-password"
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
              {loading ? "Restableciendo..." : "Restablecer Contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}