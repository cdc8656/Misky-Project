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

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "3rem auto",
        padding: "2rem",
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Reset Password</h2>

      {errorMsg && <p style={{ color: "#DC2626", marginBottom: "1rem" }}>{errorMsg}</p>}

      {successMsg && (
        <p style={{ color: "green", marginBottom: "1rem" }}>
          {successMsg}
          <br />
          <button
            onClick={() => navigate("/login")}
            style={{
              marginTop: "0.5rem",
              backgroundColor: "#3B38A0",
              color: "#fff",
              border: "none",
              padding: "6px 12px",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "background-color 0.3s ease",
              minWidth: "100px",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#7A85C1")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#3B38A0")}
          >
            Go to Login
          </button>
        </p>
      )}

      {!successMsg && accessToken && refreshToken && (
        <form onSubmit={handleResetPassword}>
          <label htmlFor="new-password" style={{ display: "block", marginBottom: "0.5rem" }}>
            New Password:
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
            style={{
              width: "100%",
              padding: "0.5rem",
              marginBottom: "1rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: "#3B38A0",
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "background-color 0.3s ease",
              minWidth: "120px",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#7A85C1")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#3B38A0")}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}
    </div>
  );
}
