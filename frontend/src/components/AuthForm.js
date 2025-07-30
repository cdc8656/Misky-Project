import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthForm({ type = "login", onAuth, supabase }) {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(type === "login");
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("customer");
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setIsLogin(type === "login");
    setIsForgotPassword(false);
    setErrorMsg("");
    resetForm();
  }, [type]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setRole("customer");
    setLocation("");
    setContact("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMsg(error.message);
      } else {
        onAuth();
        resetForm();
      }
    } catch (err) {
      setErrorMsg("Unexpected error during login.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signupError) {
        setErrorMsg(signupError.message);
        setLoading(false);
        return;
      }

      const user = signupData?.user;
      if (user) {
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            user_id: user.id,
            name,
            role,
            location,
            contact,
          },
        ]);

        if (profileError) {
          console.error("Profile insert error:", profileError.message);
          setErrorMsg("Signup succeeded, but failed to create profile: " + profileError.message);
          setLoading(false);
          return;
        }

        setErrorMsg("Signup successful! Please check your email to confirm your account before logging in.");
      }
    } catch (err) {
      setErrorMsg("Unexpected error during signup.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // New forgot password handler
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password", // optional redirect URL after reset
      });
      if (error) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg("Password reset email sent! Please check your inbox.");
      }
    } catch (err) {
      setErrorMsg("Unexpected error sending reset email.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

//UI portion

const inputStyle = {
  width: "100%",
  padding: "8px",
  marginTop: "4px",
  marginBottom: "12px",
  borderRadius: "4px",
  border: "1px solid #ccc",
  fontSize: "14px",
};

const buttonStyle = {
  backgroundColor: "#3B38A0",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: "5px",
  cursor: "pointer",
  width: "100%",
};

const labelStyle = {
  display: "block",
  color: "#1A2A80",
  marginBottom: "6px",
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
          maxWidth: "400px",
        }}
      >
        <h2 style={{ color: "#1A2A80", textAlign: "center", marginBottom: "1rem" }}>
          {isForgotPassword
            ? "Reset Password"
            : isLogin
            ? "Login"
            : "Sign Up"}
        </h2>

        {isForgotPassword ? (
          <form onSubmit={handleForgotPassword}>
            <label htmlFor="email" style={{ color: "#3B38A0" }}>
              Enter your email to reset password:
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                style={inputStyle}
              />
            </label>
            <br />
            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? "Sending..." : "Send Reset Email"}
            </button>
            <br />
            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setErrorMsg("");
              }}
              disabled={loading}
              style={{ ...buttonStyle, marginTop: "1rem" }}
            >
              Back to Login
            </button>
          </form>
        ) : (
          <form onSubmit={isLogin ? handleLogin : handleSignup}>
            <label htmlFor="email" style={labelStyle}>
              Email:
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                disabled={loading}
                style={inputStyle}
              />
            </label>
            <br />
            <label htmlFor="password" style={labelStyle}>
              Password:
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? "current-password" : "new-password"}
                disabled={loading}
                style={inputStyle}
              />
            </label>
            <br />

            {!isLogin && (
              <>
                <label htmlFor="name" style={labelStyle}>
                  Name:
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    style={inputStyle}
                  />
                </label>
                <br />
                <label htmlFor="role" style={labelStyle}>
                  Role:
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={loading}
                    style={inputStyle}
                  >
                    <option value="customer">Customer</option>
                    <option value="restaurant">Restaurant</option>
                  </select>
                </label>
                <br />
                <label htmlFor="location" style={labelStyle}>
                  Location:
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={loading}
                    style={inputStyle}
                  />
                </label>
                <br />
                <label htmlFor="contact" style={labelStyle}>
                  Contact:
                  <input
                    id="contact"
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    disabled={loading}
                    style={inputStyle}
                  />
                </label>
                <br />
              </>
            )}

            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading
                ? isLogin
                  ? "Logging in..."
                  : "Signing up..."
                : isLogin
                ? "Login"
                : "Sign Up"}
            </button>
            <br />
            {isLogin && (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(true);
                  setErrorMsg("");
                }}
                disabled={loading}
                style={{ ...buttonStyle, marginTop: "1rem" }}
              >
                Forgot Password?
              </button>
            )}
          </form>
        )}

        {errorMsg && (
          <p
            style={{
              marginTop: "1rem",
              color: errorMsg.startsWith("Signup successful") || errorMsg.startsWith("Password reset")
                ? "green"
                : "red",
              textAlign: "center",
            }}
          >
            {errorMsg}
          </p>
        )}

        <button
          onClick={() => navigate("/")}
          disabled={loading}
          style={{ ...buttonStyle, marginTop: "1rem", width: "100%" }}
        >
          Back to Homepage
        </button>
      </div>
    </div>
  );
}
