import React, { useState } from "react";

export default function AuthForm({ onAuth, supabase }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("customer");
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setRole("customer");
    setLocation("");
    setContact("");
    setErrorMsg("");
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
        onAuth(); // will refresh session + profile in App
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
      // Create user in Supabase Auth
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
        // Insert user profile in "profiles" table
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

        // Show success message, keep the form on signup so user can see it
        setErrorMsg("Signup successful! Please check your email to confirm your account before logging in.");
        // DO NOT switch to login or reset form here
      }
    } catch (err) {
      setErrorMsg("Unexpected error during signup.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto" }}>
      <h2>{isLogin ? "Login" : "Sign Up"}</h2>
      <form onSubmit={isLogin ? handleLogin : handleSignup}>
        <label htmlFor="email">
          Email:
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            disabled={loading}
          />
        </label>
        <br />
        <label htmlFor="password">
          Password:
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isLogin ? "current-password" : "new-password"}
            disabled={loading}
          />
        </label>
        <br />

        {!isLogin && (
          <>
            <label htmlFor="name">
              Name:
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </label>
            <br />
            <label htmlFor="role">
              Role:
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
              >
                <option value="customer">Customer</option>
                <option value="restaurant">Restaurant</option>
              </select>
            </label>
            <br />
            <label htmlFor="location">
              Location:
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={loading}
              />
            </label>
            <br />
            <label htmlFor="contact">
              Contact:
              <input
                id="contact"
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                disabled={loading}
              />
            </label>
            <br />
          </>
        )}

        <button type="submit" disabled={loading}>
          {loading
            ? isLogin
              ? "Logging in..."
              : "Signing up..."
            : isLogin
            ? "Login"
            : "Sign Up"}
        </button>
      </form>

      {errorMsg && (
        <p style={{ color: errorMsg.startsWith("Signup successful") ? "green" : "red" }}>
          {errorMsg}
        </p>
      )}

      <p style={{ marginTop: 10 }}>
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setErrorMsg("");
            resetForm();
          }}
          disabled={loading}
        >
          {isLogin ? "Sign Up" : "Login"}
        </button>
      </p>

      {/* Show this button only after successful signup message */}
      {!isLogin && errorMsg.startsWith("Signup successful") && (
        <button
          type="button"
          onClick={() => {
            setIsLogin(true);
            setErrorMsg("");
            resetForm();
          }}
          disabled={loading}
          style={{ marginTop: "1rem" }}
        >
          Back to Login
        </button>
      )}
    </div>
  );
}
