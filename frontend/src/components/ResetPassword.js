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
      // ✅ Set session using both tokens
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        setErrorMsg(`Failed to set session: ${sessionError.message}`);
        setLoading(false);
        return;
      }

      // ✅ Now update the user's password
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
    <div style={{ maxWidth: 400, margin: "2rem auto" }}>
      <h2>Reset Password</h2>

      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}

      {successMsg && (
        <p style={{ color: "green" }}>
          {successMsg}{" "}
          <button onClick={() => navigate("/login")}>Go to Login</button>
        </p>
      )}

      {!successMsg && accessToken && refreshToken && (
        <form onSubmit={handleResetPassword}>
          <label htmlFor="new-password">
            New Password:
            <input
              id="new-password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          <br />
          <button type="submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}
    </div>
  );
}
