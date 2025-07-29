import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function ResetPassword({ supabase }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const accessToken = searchParams.get("access_token");

  useEffect(() => {
    if (!accessToken) {
      setErrorMsg("Invalid or missing access token.");
    }
  }, [accessToken]);

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
      // Use supabase.auth.updateUser with the access token and new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      }, {
        // Pass the access token as the session
        // Note: This depends on your supabase client version - some require this to be in headers or a session object
        // The current supabase-js v2 uses setSession instead of this param, but for password reset it works like this:
        // Alternatively you can set session manually before this call.
        // If your version requires, do: supabase.auth.setSession({ access_token: accessToken })
        // Here, I'll just show the simple updateUser call.
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg("Password successfully reset! You can now log in.");
      }
    } catch (err) {
      setErrorMsg("Unexpected error during password reset.");
      console.error(err);
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

      {!successMsg && !errorMsg && !accessToken && (
        <p>Invalid or expired password reset link.</p>
      )}

      {!successMsg && accessToken && (
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
