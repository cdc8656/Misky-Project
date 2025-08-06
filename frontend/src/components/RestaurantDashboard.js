import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Link } from "react-router-dom"; //Link for navigation
import {
  fetchRestaurantItems,
  createRestaurantItem,
  fetchNotifications,
  getProfilePicture,
  cancelRestaurantItem,
  completeRestaurantItem,
  markNotificationAsRead 
} from "../api.js";

export default function RestaurantDashboard({ user }) {
  const [form, setForm] = useState({
    information: "",
    pickup_time: "",
    total_spots: "",
    price: "",
  });

  const [items, setItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showOffers, setShowOffers] = useState(true);
  const [showNotifications, setShowNotifications] = useState(true);
  const [profilePicture, setProfilePicture] = useState(null);

  const loadItems = async () => {
    if (!user?.id) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRestaurantItems(supabase);
      setItems(data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  const loadProfilePicture = async () => {
    try {
      const pictureUrl = await getProfilePicture(supabase);
      setProfilePicture(pictureUrl || null);
    } catch (err) {
      console.error("Failed to load profile picture:", err.message);
    }
  };

  const loadNotifications = async () => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications(supabase);
      setNotifications(data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch notifications");
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    loadItems();
    loadNotifications();
    loadProfilePicture();

    const channel = supabase
      .channel("restaurant-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `restaurant_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      information: form.information,
      pickup_time: form.pickup_time,
      total_spots: parseInt(form.total_spots, 10),
      price: parseFloat(form.price),
      status: "active",
      image_url: profilePicture,
    };

    try {
      // Create item first
      const newItem = await createRestaurantItem(supabase, payload);

      if (!newItem || !newItem.id) {
        throw new Error("Invalid response from createRestaurantItem");
      }

      await loadItems();

      alert("Offer created successfully!");
      setForm({
        information: "",
        pickup_time: "",
        total_spots: 1,
        price: 0,
        image: null,
      });
    } catch (err) {
      console.error("Create offer error:", err);
      alert(
        "Failed to create offer: " +
          (err?.response?.data?.detail || err?.message || JSON.stringify(err) || "Unknown error")
      );
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          JSON.stringify(err) ||
          "Failed to create offer"
      );
    } finally {
      setLoading(false);
    }
  };

  // Item canceling handler
  const handleCancel = async (itemId) => {
    if (!window.confirm("Are you sure you want to cancel this offer?")) return;

    try {
      setLoading(true);
      await cancelRestaurantItem(supabase, itemId);
      await loadItems(); // refresh after cancel
    } catch (err) {
      console.error("Failed to cancel item:", err);
      alert("Failed to cancel item: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // Item complete handler
  const handleComplete = async (itemId) => {
    if (!window.confirm("Are you sure you want to complete this offer?")) return;

    try {
      setLoading(true);
      await completeRestaurantItem(supabase, itemId);
      await loadItems(); // refresh after cancel
    } catch (err) {
      console.error("Failed to complete item:", err);
      alert("Failed to complete item: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

// notif read handler
  const handleMarkNotificationAsRead = async (notificationId) => {
  try {
    await markNotificationAsRead(supabase, notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  } catch (err) {
    console.error("Error al marcar como leída:", err);
    alert("Error al marcar la notificación como leída.");
  }
};

  const styles = {
    container: {
      backgroundColor: "#fafafa",
      minHeight: "100vh",
      fontFamily:
        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      padding:
        "max(env(safe-area-inset-top), 24px) 16px max(env(safe-area-inset-bottom), 24px)",
      background: "linear-gradient(135deg, #fafafa 0%, #f5f5f7 100%)",
    },

    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0 0 32px 0",
      maxWidth: "1200px",
      margin: "0 auto",
    },

    logo: {
      width: "75px",
      height: "auto",
      borderRadius: "8px",
    },

    title: {
      color: "#1a1a1a",
      fontSize: "clamp(1.5rem, 4vw, 2rem)",
      fontWeight: "700",
      margin: 0,
      letterSpacing: "-0.02em",
    },

    profileButton: {
      backgroundColor: "#3B38A0",
      color: "white",
      padding: "12px 20px",
      borderRadius: "12px",
      textDecoration: "none",
      fontWeight: "600",
      fontSize: "0.95rem",
      transition: "all 0.2s ease",
      boxShadow: "0 2px 8px rgba(59, 56, 160, 0.3)",
      minHeight: "44px",
      display: "flex",
      alignItems: "center",
    },

    content: {
      maxWidth: "1200px",
      margin: "0 auto",
    },

    sectionTitle: {
      color: "#1a1a1a",
      fontSize: "clamp(1.3rem, 3.5vw, 1.75rem)",
      fontWeight: "600",
      marginBottom: "24px",
      marginTop: "48px",
      letterSpacing: "-0.01em",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },

    form: {
      backgroundColor: "white",
      padding: "24px",
      borderRadius: "16px",
      boxShadow:
        "0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1)",
      border: "1px solid rgba(255, 255, 255, 0.8)",
      marginBottom: "48px",
      display: "grid",
      gap: "20px",
      maxWidth: "600px",
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
    },

    button: {
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
    },

    buttonSecondary: {
      backgroundColor: "#DC2626",
      color: "white",
      border: "none",
      padding: "12px 20px",
      borderRadius: "12px",
      cursor: "pointer",
      fontSize: "0.95rem",
      fontWeight: "600",
      transition: "all 0.2s ease",
      boxShadow: "0 2px 8px rgba(220, 38, 38, 0.3)",
      minHeight: "44px",
      marginRight: "12px",
    },

    grid: {
      display: "grid",
      gap: "24px",
      marginBottom: "48px",
    },

    card: {
      backgroundColor: "white",
      borderRadius: "16px",
      padding: "24px",
      boxShadow:
        "0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1)",
      border: "1px solid rgba(255, 255, 255, 0.8)",
      transition: "all 0.3s ease",
      display: "flex",
      gap: "20px",
      alignItems: "flex-start",
    },

    cardImage: {
      width: "120px",
      height: "120px",
      objectFit: "cover",
      borderRadius: "12px",
      flexShrink: 0,
    },

    cardImagePlaceholder: {
      width: "120px",
      height: "120px",
      backgroundColor: "#f3f4f6",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#9ca3af",
      fontSize: "0.875rem",
      flexShrink: 0,
    },

    cardContent: {
      flex: 1,
      color: "#1a1a1a",
    },

    cardTitle: {
      fontSize: "1.2rem",
      fontWeight: "600",
      margin: "0 0 12px 0",
      letterSpacing: "-0.01em",
    },

    cardText: {
      margin: "8px 0",
      color: "#4a4a4a",
      lineHeight: "1.5",
    },

    notification: {
      backgroundColor: "white",
      padding: "16px 20px",
      borderRadius: "12px",
      marginBottom: "12px",
      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
      border: "1px solid rgba(255, 193, 7, 0.3)",
      borderLeft: "4px solid #FFC107",
    },

    message: {
      padding: "12px 20px",
      borderRadius: "12px",
      marginBottom: "24px",
      fontWeight: "500",
    },

    errorMessage: {
      backgroundColor: "#FEF2F2",
      color: "#DC2626",
      border: "1px solid #FCA5A5",
    },

    loadingMessage: {
      backgroundColor: "#F0F9FF",
      color: "#0369A1",
      border: "1px solid #7DD3FC",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header Section */}
        <div style={styles.header}>
          <img src="/Misky Logo.png" alt="Misky Logo" style={styles.logo} />

          <h1 style={styles.title}>Panel de Restaurante</h1>

          <Link
            to="/profile"
            style={styles.profileButton}
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
            Perfil
          </Link>
        </div>

        {/* Restaurant Notifications */}
          <h3
            style={styles.sectionTitle}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            {showNotifications ? "▼" : "▶"} 🔔 Notificaciones
          </h3>

          {showNotifications && (
            <>
              {notifications.length === 0 ? (
                <div
                  style={{
                    ...styles.card,
                    textAlign: "center",
                    justifyContent: "center",
                  }}
                >
                  <p style={{ color: "#6b6b6b", margin: 0 }}>
                    No tienes notificaciones aún.
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "12px", marginBottom: "48px" }}>
                  {notifications.map((note) => (
                    <div key={note.id} style={styles.notification}>
                      <p
                        style={{
                          margin: "0 0 8px 0",
                          color: "#1a1a1a",
                          fontWeight: "500",
                        }}
                      >
                        {note.message}
                      </p>
                      <span
                        style={{ color: "#6b6b6b", fontSize: "0.85rem" }}
                      >
                        {new Date(note.created_at).toLocaleString("es-PE", {
                          timeZone: "America/Lima",
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                      <button
                        onClick={() => handleMarkNotificationAsRead(note.id)}
                        style={{
                          marginTop: "8px",
                          padding: "4px 8px",
                          fontSize: "0.75rem",
                          backgroundColor: "#e0e0e0",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Marcar como leída
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}


        {/* Item Creation Form */}
        <h3 style={styles.sectionTitle}>✨ Crear Nueva Oferta</h3>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            name="information"
            placeholder="Descripción de la comida (ej: Croissants frescos, Porciones de pizza)"
            value={form.information}
            onChange={handleChange}
            required
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
          <input
            name="pickup_time"
            type="datetime-local"
            value={form.pickup_time}
            onChange={handleChange}
            required
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
          <input
            name="total_spots"
            type="number"
            min="1"
            placeholder="Número de porciones disponibles"
            value={form.total_spots}
            onChange={handleChange}
            required
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
          <input
            name="price"
            type="number"
            step="0.01"
            placeholder="Precio en soles (S/.)"
            value={form.price}
            onChange={handleChange}
            required
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
                e.target.style.boxShadow = "0 4px 12px rgba(59, 56, 160, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#3B38A0";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 8px rgba(59, 56, 160, 0.3)";
            }}
          >
            {loading ? "Creando..." : "Crear Oferta"}
          </button>
          {error && <p style={{ color: "#DC2626" }}>{error}</p>}
        </form>

        {/* Active Offers List */}
          <h3
            style={styles.sectionTitle}
            onClick={() => setShowOffers(!showOffers)}
          >
            {showOffers ? "▼" : "▶"} 🥡 Ofertas Activas
          </h3>

          {showOffers && (
            <>
              {loading && items.length === 0 ? (
                <p style={{ color: "#6b6b6b" }}>Cargando ofertas...</p>
              ) : items.length === 0 ? (
                <p style={{ color: "#6b6b6b" }}>
                  No tienes ofertas activas. ¡Crea una arriba!
                </p>
              ) : (
                <div style={styles.grid}>
                  {items.map((item) => (
                    <div key={item.id} style={styles.card}>
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt="Item"
                          style={styles.cardImage}
                        />
                      ) : (
                        <div style={styles.cardImagePlaceholder}>Sin Imagen</div>
                      )}

                      <div style={styles.cardContent}>
                        <h4 style={styles.cardTitle}>{item.information}</h4>

                        {/* Pickup time in Spanish (Peru) timezone */}
                        <p style={styles.cardText}>
                          <strong>Recojo:</strong>{" "}
                          {new Date(item.pickup_time).toLocaleString("es-PE", {
                            timeZone: "America/Lima",
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>

                        <p style={styles.cardText}>
                          <strong>Porciones disponibles:</strong> {item.total_spots}
                        </p>

                        <p style={styles.cardText}>
                          <strong>Precio:</strong> S/. {item.price.toFixed(2)}
                        </p>

                        <div style={{ marginTop: "12px" }}>
                          {item.status === "active" ? (
                            <>
                              <button
                                onClick={() => handleCancel(item.id)}
                                style={styles.buttonSecondary}
                                disabled={loading}
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleComplete(item.id)}
                                style={styles.button}
                                disabled={loading}
                              >
                                Completar
                              </button>
                            </>
                          ) : (
                            <p
                              style={{
                                color:
                                  item.status === "completed"
                                    ? "#22c55e" // green
                                    : item.status === "canceled"
                                    ? "#dc2626" // red
                                    : "#a8a29e", // gray for expired
                                fontWeight: "600",
                              }}
                            >
                              {item.status === "completed"
                                ? "Oferta completada"
                                : item.status === "canceled"
                                ? "Oferta cancelada"
                                : "Oferta expirada"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

      </div>
    </div>
  );
}
