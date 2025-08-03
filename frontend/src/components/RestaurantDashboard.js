import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Link } from "react-router-dom"; //Link for navigation
import {
  fetchRestaurantItems,
  createRestaurantItem,
  fetchNotifications,
  uploadItemImage,
  updateRestaurantItemImage,
  cancelRestaurantItem,
  completeRestaurantItem,
} from "../api.js";

export default function RestaurantDashboard({ user }) {
  const [form, setForm] = useState({
    information: "",
    pickup_time: "",
    total_spots: "",
    price: "",
    image: null,
  });

  const [items, setItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showOffers, setShowOffers] = useState(true);
  const [showNotifications, setShowNotifications] = useState(true);

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
    const { name, value, files } = e.target;
    if (name === "image") {
      setForm((prev) => ({
        ...prev,
        image: files?.[0] || null,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
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
      status: "active"
    };

    try {
      // Create item first
      const newItem = await createRestaurantItem(supabase, payload);

      if (!newItem || !newItem.id) {
        throw new Error("Invalid response from createRestaurantItem");
      }

      if (form.image && form.image instanceof File) {
        const imageUrl = await uploadItemImage(supabase, form.image, newItem.id);

        console.log("Uploaded image URL:", imageUrl);

        // Patch item with image URL
        await updateRestaurantItemImage(newItem.id, imageUrl, supabase);

        // Reload items to reflect image_url update
        await loadItems();
      } else {
        await loadItems();
      }

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



const styles = {
  container: {
    backgroundColor: "#fafafa",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: "max(env(safe-area-inset-top), 24px) 16px max(env(safe-area-inset-bottom), 24px)",
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
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1)",
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
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1)",
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
      <img
        src="/Misky Logo.png"
        alt="Misky Logo"
        style={styles.logo}
      />

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

    {/* Notifications */}
    <h3
      style={styles.sectionTitle}
      onClick={() => setShowNotifications(!showNotifications)}
    >
      {showNotifications ? "▼" : "▶"} 🔔 Notificaciones
    </h3>
    {showNotifications && (
      <>
        {notifications.length === 0 ? (
          <div style={{...styles.card, textAlign: "center", justifyContent: "center"}}>
            <p style={{color: "#6b6b6b", margin: 0}}>No tienes notificaciones aún.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px", marginBottom: "48px" }}>
            {notifications.map((note) => (
              <div
                key={note.id}
                style={styles.notification}
              >
                <p style={{ margin: "0 0 8px 0", color: "#1a1a1a", fontWeight: "500" }}>
                  {note.message}
                </p>
                <span style={{ color: "#6b6b6b", fontSize: "0.85rem" }}>
                  {new Date(note.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </>
    )}

    {/* Item Creation Form */}
    <h3 style={styles.sectionTitle}>
      ✨ Crear Nueva Oferta
    </h3>
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
      <input
        type="file"
        name="image"
        accept="image/*"
        onChange={handleChange}
        style={{...styles.input, padding: "8px 12px"}}
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
    </form>

    {/* Current Offers */}
    <h3
      style={styles.sectionTitle}
      onClick={() => setShowOffers(!showOffers)}
    >
      {showOffers ? "▼" : "▶"} 🍽️ Tus Ofertas Actuales
    </h3>

    {showOffers && (
      <>
        {loading && (
          <div style={{...styles.message, ...styles.loadingMessage}}>
            Cargando ofertas…
          </div>
        )}
        
        {error && (
          <div style={{...styles.message, ...styles.errorMessage}}>
            Error: {error}
          </div>
        )}
        
        {!loading && !error && items.length === 0 && (
          <div style={{...styles.card, textAlign: "center", justifyContent: "center"}}>
            <p style={{color: "#6b6b6b", margin: 0}}>No se encontraron ofertas.</p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div style={styles.grid}>
            {items.map((item) => (
              <div
                key={item.id}
                style={styles.card}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1)";
                }}
              >
                {/* Image */}
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.information}
                    style={styles.cardImage}
                  />
                ) : (
                  <div style={styles.cardImagePlaceholder}>
                    Sin Imagen
                  </div>
                )}

                {/* Details */}
                <div style={styles.cardContent}>
                  <h4 style={styles.cardTitle}>{item.information}</h4>
                  <p style={styles.cardText}>
                    <strong>Recojo:</strong> {new Date(item.pickup_time).toLocaleString()}
                  </p>
                  <p style={styles.cardText}>
                    <strong>Precio:</strong> <b>S/.</b>{item.price.toFixed(2)} &nbsp;&nbsp;
                    <strong>Disponibles:</strong> {item.total_spots - (item.num_of_reservations || 0)}
                  </p>
                  <p style={styles.cardText}>
                    <strong>Ubicación:</strong> {item.location}
                  </p>
                  <p style={{...styles.cardText, marginBottom: "16px"}}>
                    <strong>Estado:</strong> <span style={{
                      backgroundColor: item.status === "active" ? "#10B981" : "#6B7280",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      fontWeight: "600"
                    }}>{item.status === "active" ? "activa" : item.status === "completed" ? "completada" : "cancelada"}</span>
                  </p>

                  {/* Action Buttons */}
                  {item.status === "active" && (
                    <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                      <button
                        disabled={loading}
                        onClick={() => handleCancel(item.id)}
                        style={{
                          ...styles.buttonSecondary,
                          opacity: loading ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!loading) {
                            e.target.style.backgroundColor = "#B91C1C";
                            e.target.style.transform = "translateY(-1px)";
                            e.target.style.boxShadow = "0 4px 12px rgba(220, 38, 38, 0.4)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "#DC2626";
                          e.target.style.transform = "translateY(0)";
                          e.target.style.boxShadow = "0 2px 8px rgba(220, 38, 38, 0.3)";
                        }}
                      >
                        Cancelar Oferta
                      </button>
                      <button
                        disabled={loading}
                        onClick={() => handleComplete(item.id)}
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
                        Completar Oferta
                      </button>
                    </div>
                  )}
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