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
  const [profileImage, setProfileImage] = useState(null);
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
    setProfileImage(null);
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
      setErrorMsg("Error inesperado al iniciar sesión.");
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
      // 1. Sign up the user
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
      if (!user) {
        setErrorMsg("No se pudo registrar el usuario.");
        setLoading(false);
        return;
      }

      // 2. Upload profile image if provided
      let profilePictureUrl = null;
      if (profileImage) {
        const fileExt = profileImage.name.split(".").pop();
        const filePath = `item-images/${user.id}-profile.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("item-images")
          .upload(filePath, profileImage, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          console.error("Error uploading profile image:", uploadError.message);
          setErrorMsg("Registro exitoso, pero falló la carga de la foto de perfil.");
          setLoading(false);
          return;
        }

        const { data } = supabase.storage.from("item-images").getPublicUrl(filePath);
        profilePictureUrl = data.publicUrl;
      }

      // 3. Insert profile data including profile_picture URL
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          user_id: user.id,
          name,
          role,
          location,
          contact,
          profile_picture: profilePictureUrl,
        },
      ]);

      if (profileError) {
        console.error("Profile insert error:", profileError.message);
        setErrorMsg("Registro exitoso, pero falló al crear el perfil: " + profileError.message);
        setLoading(false);
        return;
      }

      setErrorMsg("¡Registro exitoso! Por favor revisa tu email para confirmar tu cuenta antes de iniciar sesión.");
      resetForm();
    } catch (err) {
      setErrorMsg("Error inesperado durante el registro.");
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
        redirectTo: window.location.origin + "/reset-password",
      });
      if (error) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg("¡Email de restablecimiento enviado! Por favor revisa tu bandeja de entrada.");
      }
    } catch (err) {
      setErrorMsg("Error inesperado al enviar el email de restablecimiento.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // UI styles
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
            ? "Restablecer Contraseña"
            : isLogin
            ? "Iniciar Sesión"
            : "Crear Cuenta"}
        </h2>

        {isForgotPassword ? (
          <form onSubmit={handleForgotPassword}>
            <label htmlFor="email" style={{ color: "#3B38A0" }}>
              Ingresa tu email para restablecer tu contraseña:
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
              {loading ? "Enviando..." : "Enviar Email de Restablecimiento"}
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
              Volver a Iniciar Sesión
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
              Contraseña:
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
                  Nombre:
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
                  Tipo de Usuario:
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={loading}
                    style={inputStyle}
                  >
                    <option value="customer">Cliente</option>
                    <option value="restaurant">Restaurante</option>
                  </select>
                </label>
                <br />
                <label htmlFor="location" style={labelStyle}>
                  Ubicación:
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
                  Contacto:
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
                <label htmlFor="profileImage" style={labelStyle}>
                  Foto de Perfil:
                  <input
                    id="profileImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfileImage(e.target.files[0])}
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
                  ? "Iniciando sesión..."
                  : "Creando cuenta..."
                : isLogin
                ? "Iniciar Sesión"
                : "Crear Cuenta"}
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
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </form>
        )}

        {errorMsg && (
          <p
            style={{
              marginTop: "1rem",
              color:
                errorMsg.startsWith("¡Registro exitoso") ||
                errorMsg.startsWith("¡Email de restablecimiento")
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
          Volver al Inicio
        </button>
      </div>
    </div>
  );
}
