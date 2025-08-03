import React from "react";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  const styles = {
    container: {
      backgroundColor: "#fafafa",
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      padding: "max(env(safe-area-inset-top), 24px) 16px max(env(safe-area-inset-bottom), 24px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      lineHeight: "1.7",
      background: "linear-gradient(135deg, #fafafa 0%, #f5f5f7 100%)",
    },

    content: {
      maxWidth: "420px",
      width: "100%",
      margin: "0 auto",
    },

    logo: {
      width: "160px",
      height: "auto",
      marginBottom: "32px",
      maxWidth: "80vw",
      borderRadius: "12px",
    },

    mainHeader: {
      color: "#1a1a1a",
      fontWeight: "700",
      fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
      marginBottom: "24px",
      letterSpacing: "-0.02em",
      lineHeight: "1.2",
    },

    paragraph: {
      color: "#4a4a4a",
      fontSize: "clamp(1.1rem, 4vw, 1.25rem)",
      marginBottom: "48px",
      lineHeight: "1.6",
      fontWeight: "400",
    },

    sectionHeader: {
      color: "#1a1a1a",
      fontWeight: "600",
      fontSize: "clamp(1.5rem, 4.5vw, 1.875rem)",
      marginBottom: "32px",
      letterSpacing: "-0.01em",
    },

    stepsList: {
      display: "grid",
      gap: "24px",
      marginBottom: "48px",
      textAlign: "left",
    },

    stepItem: {
      display: "flex",
      alignItems: "flex-start",
      gap: "16px",
      padding: "20px",
      backgroundColor: "white",
      borderRadius: "16px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1)",
      transition: "all 0.3s ease",
      border: "1px solid rgba(255, 255, 255, 0.8)",
    },

    stepIcon: {
      fontSize: "24px",
      minWidth: "32px",
      height: "32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "8px",
      backgroundColor: "rgba(59, 56, 160, 0.1)",
      filter: "hue-rotate(270deg) saturate(1.2)",
    },

    stepContent: {
      flex: 1,
    },

    stepTitle: {
      fontWeight: "600",
      fontSize: "1.1rem",
      color: "#1a1a1a",
      marginBottom: "4px",
      letterSpacing: "-0.01em",
    },

    stepDescription: {
      color: "#6b6b6b",
      fontSize: "0.95rem",
      lineHeight: "1.5",
    },

    finalHeader: {
      color: "#1a1a1a",
      fontWeight: "600",
      fontSize: "clamp(1.4rem, 4.5vw, 1.75rem)",
      marginBottom: "40px",
      letterSpacing: "-0.01em",
      lineHeight: "1.3",
    },

    buttonContainer: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      alignItems: "center",
      width: "100%",
    },

    loginButton: {
      backgroundColor: "#3B38A0",
      color: "white",
      border: "none",
      padding: "16px 32px",
      borderRadius: "12px",
      cursor: "pointer",
      fontSize: "1.1rem",
      fontWeight: "600",
      minHeight: "48px",
      width: "100%",
      maxWidth: "280px",
      transition: "all 0.2s ease",
      boxShadow: "0 4px 12px rgba(59, 56, 160, 0.3)",
      letterSpacing: "-0.01em",
    },

    registerText: {
      color: "#6b6b6b",
      fontSize: "0.95rem",
    },

    registerLink: {
      color: "#3B38A0",
      textDecoration: "none",
      cursor: "pointer",
      fontWeight: "500",
      borderBottom: "1px solid transparent",
      transition: "all 0.2s ease",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <img
          src="/Misky Logo.png"
          alt="Misky Logo"
          style={styles.logo}
        />

        <h1 style={styles.mainHeader}>
          ¡Comida que no se pierde se disfruta!
        </h1>

        <p style={styles.paragraph}>
          Reserva productos de panaderías y restaurantes locales antes de que se acaben. 
          Paga en persona. Ahorra dinero. Ayuda a tu comunidad.
        </p>

        <h2 style={styles.sectionHeader}>
          ¿Cómo funciona?
        </h2>

        <div style={styles.stepsList}>
          <div 
            style={styles.stepItem}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1)";
            }}
          >
            <div style={styles.stepIcon}>🔍</div>
            <div style={styles.stepContent}>
              <div style={styles.stepTitle}>1. Explora</div>
              <div style={styles.stepDescription}>
                Encuentra comida cerca de ti.
              </div>
            </div>
          </div>

          <div 
            style={styles.stepItem}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1)";
            }}
          >
            <div style={styles.stepIcon}>🕐</div>
            <div style={styles.stepContent}>
              <div style={styles.stepTitle}>2. Reserva</div>
              <div style={styles.stepDescription}>
                Haz tu reserva con un solo clic. Sin pagos en línea.
              </div>
            </div>
          </div>

          <div 
            style={styles.stepItem}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1)";
            }}
          >
            <div style={styles.stepIcon}>⭐</div>
            <div style={styles.stepContent}>
              <div style={styles.stepTitle}>3. Recoge</div>
              <div style={styles.stepDescription}>
                Pasa por el local en el horario indicado. ¡Listo!
              </div>
            </div>
          </div>
        </div>

        <h2 style={styles.finalHeader}>
          Lo bueno no se tira. Se comparte.
        </h2>

        <div style={styles.buttonContainer}>
          <button
            onClick={() => navigate("/login")}
            style={styles.loginButton}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#5A56C4";
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 6px 16px rgba(59, 56, 160, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#3B38A0";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 12px rgba(59, 56, 160, 0.3)";
            }}
            onTouchStart={(e) => {
              e.target.style.transform = "translateY(0)";
            }}
          >
            Iniciar sesión
          </button>

          <div style={styles.registerText}>
            ¿Nuevo por aquí?{" "}
            <span
              style={styles.registerLink}
              onClick={() => navigate("/register")}
              onMouseEnter={(e) => {
                e.target.style.borderBottomColor = "#3B38A0";
                e.target.style.color = "#5A56C4";
              }}
              onMouseLeave={(e) => {
                e.target.style.borderBottomColor = "transparent";
                e.target.style.color = "#3B38A0";
              }}
            >
              Crear cuenta
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}