import React from "react";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  const containerStyle = {
    backgroundColor: "white",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
    padding: "20px",
    textAlign: "center",
    lineHeight: "1.6",
  };

  const logoStyle = {
    width: "150px",
    height: "auto",
    marginBottom: "30px",
    maxWidth: "80vw",
  };

  const mainHeaderStyle = {
    color: "black",
    fontWeight: "bold",
    fontSize: "clamp(1.5rem, 5vw, 2.2rem)",
    marginBottom: "20px",
    fontFamily: "Arial, sans-serif",
  };

  const paragraphStyle = {
    color: "#333",
    fontSize: "clamp(1rem, 4vw, 1.2rem)",
    marginBottom: "30px",
    maxWidth: "90%",
    margin: "0 auto 30px auto",
    lineHeight: "1.5",
  };

  const sectionHeaderStyle = {
    color: "black",
    fontWeight: "bold",
    fontSize: "clamp(1.3rem, 4.5vw, 1.8rem)",
    marginBottom: "20px",
    marginTop: "30px",
  };

  const bulletListStyle = {
    textAlign: "left",
    maxWidth: "90%",
    margin: "0 auto 30px auto",
    fontSize: "clamp(0.9rem, 3.5vw, 1.1rem)",
    color: "#333",
  };

  const bulletItemStyle = {
    marginBottom: "15px",
    paddingLeft: "20px",
  };

  const finalHeaderStyle = {
    color: "black",
    fontWeight: "bold",
    fontSize: "clamp(1.3rem, 4.5vw, 1.8rem)",
    marginBottom: "30px",
    marginTop: "30px",
  };

  const loginButtonStyle = {
    backgroundColor: "#3B38A0",
    color: "white",
    border: "none",
    padding: "15px 30px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "clamp(1rem, 4vw, 1.2rem)",
    fontWeight: "bold",
    marginBottom: "15px",
    width: "200px",
    maxWidth: "80vw",
  };

  const registerTextStyle = {
    color: "#333",
    fontSize: "clamp(0.9rem, 3.5vw, 1rem)",
    marginTop: "10px",
  };

  const registerLinkStyle = {
    color: "#3B38A0",
    textDecoration: "underline",
    cursor: "pointer",
  };

  return (
    <div style={containerStyle}>
      {/* Misky Logo */}
      <img
        src="/Misky Logo W.png"
        alt="Misky Logo"
        style={logoStyle}
      />

      {/* Main Header */}
      <h1 style={mainHeaderStyle}>
        ¡Comida que no se pierde se disfruta!
      </h1>

      {/* Main Description */}
      <p style={paragraphStyle}>
        Reserva productos de panaderías y restaurantes locales antes de que se acaben. 
        Paga en persona. Ahorra dinero. Ayuda a tu comunidad.
      </p>

      {/* How it works section */}
      <h2 style={sectionHeaderStyle}>
        ¿Cómo funciona?
      </h2>

      <div style={bulletListStyle}>
        <div style={bulletItemStyle}>
          <strong>1. Explora</strong><br />
          Encuentra comida cerca de ti.
        </div>
        <div style={bulletItemStyle}>
          <strong>2. Reserva</strong><br />
          Haz tu reserva con un solo clic. Sin pagos en línea.
        </div>
        <div style={bulletItemStyle}>
          <strong>3. Recoge</strong><br />
          Pasa por el local en el horario indicado. ¡Listo!
        </div>
      </div>

      {/* Final message */}
      <h2 style={finalHeaderStyle}>
        Lo bueno no se tira. Se comparte.
      </h2>

      {/* Login Button */}
      <button
        onClick={() => navigate("/login")}
        style={loginButtonStyle}
        onMouseOver={(e) => (e.target.style.backgroundColor = "#7A85C1")}
        onMouseOut={(e) => (e.target.style.backgroundColor = "#3B38A0")}
      >
        Iniciar sesión
      </button>

      {/* Register link */}
      <div style={registerTextStyle}>
        ¿Nuevo por aquí?{" "}
        <span
          style={registerLinkStyle}
          onClick={() => navigate("/register")}
        >
          Crear cuenta
        </span>
      </div>
    </div>
  );
}