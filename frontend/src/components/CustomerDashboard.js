//NOTES: CustomerDashboard.js goes through fastAPI backend, doesn't talk directly to Supabase


import { useEffect, useState } from "react"; //useEffect: runs side-effects (e.g., fetching data after component mounts), useState: allows you to create reactive variables (items, loading, etc.)
import { supabase } from "./supabaseClient"; //initialize Supabase client, used to get the user session and token
import { Link } from "react-router-dom"; //Link for navigation
import { 
  fetchItems, 
  fetchReservations, 
  createReservation, 
  cancelReservation, 
  completeReservation,
  fetchNotifications,
  markNotificationAsRead } from "../api"; //helper functions that make HTTP requests to FastAPI backend

export default function CustomerDashboard({ user }) { //main react component
  //state setup
  const [items, setItems] = useState([]); //food items pulled from the backend
  const [reservations, setReservations] = useState([]); //current user’s reservations
  const [notifications, setNotifications] = useState([]); //// Notifications state
  const [loading, setLoading] = useState(false); //loading tracks if app is currently fetching data
  const [error, setError] = useState(""); //error messaging if error encountered during processes
  const [searchTerm, setSearchTerm] = useState(""); //search terms
  const [showOffers, setShowOffers] = useState(true);
  const [showReservations, setShowReservations] = useState(true);
  const [showNotifications, setShowNotifications] = useState(true);
  const [selectedQuantities, setSelectedQuantities] = useState({});

  // Load available items from backend
  const loadItems = async () => {
    try {
      const data = await fetchItems(supabase); //HTTP request to your backend (using Supabase for token)
      setItems(data); //data is set to items state
      setError("");
    } catch (err) {
      //handle errors
      console.error(err);
      setError(err.message || "Failed to load items.");
    }
  };

  // Load user reservations
  const loadReservations = async () => {
    try {
      if (!user?.id) { //If no user is logged in, don’t try to fetch reservations
        setReservations([]);
        return;
      }
      const data = await fetchReservations(supabase); //HTTP request to your backend (using Supabase for token)
      setReservations(data);
      setError("");
    } catch (err) {
      //handle errors
      console.error(err);
      setError(err.message || "Failed to load your reservations.");
    }
  };

  
  // Load customer notifications
  const loadNotifications = async () => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Fetch notifications for this customer via Supabase
      const data = await fetchNotifications(supabase);
      setNotifications(data || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError(err.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadItems(); 
  }, []); //Run loadItems() when the component first mounts (empty [] dependency)

  useEffect(() => {
    loadReservations();
    loadNotifications(); // load notifications on user change

    if (!user?.id) return;

    // Subscribe to realtime notifications for this customer
    const channel = supabase
      .channel("customer-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `customer_id=eq.${user.id}`,
        },
        (payload) => {
          // Prepend new notification to the list
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
  

  // Make a reservation
  const reserve = async (item_id) => {
    if (!user?.id) {
      alert("You are not logged in.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const quantity = selectedQuantities[item_id] || 1; // get selected quantity or default to 1

      // Build payload
      const payload = {
        customer_id: user.id,
        item_id,
        quantity,             
        timestamp: new Date().toISOString(),
        status: "active",
      };

      await createReservation(supabase, payload);

      alert("Reservation created!");

      await loadReservations();
      await loadItems();

    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create reservation.");
    } finally {
      setLoading(false);
    }
  };

  //handler to update quantity selection for an item
  const handleQuantityChange = (item_id, value) => {
    setSelectedQuantities(prev => ({
      ...prev,
      [item_id]: Number(value),
    }));
  };


  // cancel reservation
  const cancel = async (reservation_id) => {
  if (!user?.id) {
    alert("You are not logged in.");
    return;
  }

  setLoading(true);
  setError("");

  try {
    // Cancel the reservation via FastAPI helper
    await cancelReservation(supabase, reservation_id);

    alert("Reservation cancelled!"); // Give user feedback

    //Refresh UI state
    await loadReservations();
    await loadItems();
  } catch (err) {
    console.error("Cancel failed:", err);
    setError(err.message || "Failed to cancel reservation.");
    alert("Failed to cancel reservation.");
  } finally {
    setLoading(false);
  }
};


//confirm a reservation
const complete = async (reservation_id) => {
  if (!user?.id) {
    alert("You are not logged in.");
    return;
  }

  setLoading(true);
  setError("");

  try {
    await completeReservation(supabase, reservation_id);

    alert("Reservation completed!");

    await loadReservations();
    await loadItems();
  } catch (err) {
    console.error("Completion failed:", err);
    setError(err.message || "Failed to complete reservation.");
    alert("Failed to complete reservation.");
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




  //Filter items based on search input
  const filteredItems = items
    .map(item => ({
      ...item,
      available: item.total_spots - (item.num_of_reservations || 0)
    }))
    .filter(item => item.available > 0)
    .filter(item => item.status === "active")
    .filter(item =>
      item.information.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase())
    );


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

  searchInput: {
    width: "100%",
    padding: "16px 20px",
    fontSize: "1rem",
    border: "2px solid rgba(255, 255, 255, 0.8)",
    borderRadius: "16px",
    backgroundColor: "white",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
    marginBottom: "32px",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
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
    marginTop: "12px",
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

// UI/HTML Portion
return (
  <div style={styles.container}>
    <div style={styles.content}>
      {/* Header Section */}
      <div style={styles.header}>
        <img src="/Misky Logo.png" alt="Misky Logo" style={styles.logo} />

        <h1 style={styles.title}>Panel de Cliente</h1>

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

      {/* Messages */}
      {error && (
        <div style={{ ...styles.message, ...styles.errorMessage }}>{error}</div>
      )}
      {loading && (
        <div style={{ ...styles.message, ...styles.loadingMessage }}>
          Procesando reserva…
        </div>
      )}

      {/* Search Section */}
      <h2 style={styles.sectionTitle}>🔍 Buscar Ofertas</h2>

      <input
        type="text"
        placeholder="Busca comida o ubicación del restaurante..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={styles.searchInput}
        onFocus={(e) => {
          e.target.style.borderColor = "#3B38A0";
          e.target.style.boxShadow = "0 4px 12px rgba(59, 56, 160, 0.15)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "rgba(255, 255, 255, 0.8)";
          e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.06)";
        }}
      />

      {/* Available Food Offers */}
      <h3 style={styles.sectionTitle} onClick={() => setShowOffers(!showOffers)}>
        {showOffers ? "▼" : "▶"} 🍽️ Ofertas Disponibles
      </h3>
      {showOffers && (
        <>
          {filteredItems.length === 0 ? (
            <div
              style={{
                ...styles.card,
                textAlign: "center",
                justifyContent: "center",
              }}
            >
              <p style={{ color: "#6b6b6b", margin: 0 }}>
                No hay ofertas de comida disponibles en este momento.
              </p>
            </div>
          ) : (
            <div style={styles.grid}>
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  style={styles.card}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1)";
                  }}
                >
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.information}
                      style={styles.cardImage}
                    />
                  )}

                  <div style={styles.cardContent}>
                    <h4 style={styles.cardTitle}>{item.information}</h4>
                    <p style={styles.cardText}>
                      <strong>Recojo:</strong>{" "}
                      {new Date(item.pickup_time).toLocaleString()}
                    </p>
                    <p style={styles.cardText}>
                      <strong>Precio:</strong> <b>S/.</b> {item.price.toFixed(2)}{" "}
                      &nbsp;&nbsp;
                      <strong>Disponibles:</strong>{" "}
                      {item.total_spots - (item.num_of_reservations || 0)}
                    </p>
                    <p style={styles.cardText}>
                      <strong>Ubicación:</strong> {item.location}
                    </p>
                    <label
                      htmlFor={`quantity-select-${item.id}`}
                      style={{ marginRight: 8, fontWeight: "600" }}
                    >
                      Cantidad:
                    </label>
                    <select
                      id={`quantity-select-${item.id}`}
                      value={selectedQuantities[item.id] || 1}
                      onChange={(e) =>
                        handleQuantityChange(item.id, e.target.value)
                      }
                      disabled={loading}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        marginBottom: "12px",
                        fontSize: "1rem",
                        width: "70px",
                      }}
                    >
                      {[...Array(item.total_spots - (item.num_of_reservations || 0)).keys()].map(
                        (i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        )
                      )}
                    </select>
                    <button
                      disabled={loading}
                      onClick={() => reserve(item.id)}
                      style={{
                        ...styles.button,
                        opacity: loading ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.target.style.backgroundColor = "#5A56C4";
                          e.target.style.transform = "translateY(-1px)";
                          e.target.style.boxShadow =
                            "0 4px 12px rgba(59, 56, 160, 0.4)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#3B38A0";
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow =
                          "0 2px 8px rgba(59, 56, 160, 0.3)";
                      }}
                    >
                      Reservar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
// Shows existing reservations
      {/* Your Reservations */}
        <h3
          style={styles.sectionTitle}
          onClick={() => setShowReservations(!showReservations)}
        >
          {showReservations ? "▼" : "▶"} 📋 Mis Reservas
        </h3>

        {showReservations && (
          <>
            {reservations.length === 0 ? (
              <div
                style={{
                  ...styles.card,
                  textAlign: "center",
                  justifyContent: "center",
                }}
              >
                <p style={{ color: "#6b6b6b", margin: 0 }}>Aún no tienes reservas.</p>
              </div>
            ) : (
              <div style={styles.grid}>
                {reservations.map((r) => (
                  <div
                    key={r.id}
                    style={styles.card}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        "0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1)";
                    }}
                  >
                    <div style={styles.cardContent}>
                      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                        {r.item.image_url && (
                          <img
                            src={r.item.image_url}
                            alt={r.item.information}
                            style={{
                              width: 120,
                              height: 120,
                              objectFit: "cover",
                              borderRadius: 12,
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <div style={{ flex: 1, color: "#1a1a1a" }}>
                          <h4 style={styles.cardTitle}>{r.item.information}</h4>
                          <p style={styles.cardText}>
                            <strong>Cantidad:</strong> {r.quantity}
                          </p>
                          <p style={styles.cardText}>
                            <strong>Hora de recojo:</strong>{" "}
                            {new Date(r.item.pickup_time).toLocaleString("es-PE", {
                              timeZone: "America/Lima",
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                          <p style={styles.cardText}>
                            <strong>Precio:</strong> <b>S/.</b> {r.item.price.toFixed(2)}
                          </p>
                          <p style={styles.cardText}>
                            <strong>Ubicación:</strong> {r.item.location}
                          </p>
                          <p style={{ ...styles.cardText, marginBottom: "16px" }}>
                            <strong>Estado:</strong>{" "}
                            <span
                              style={{
                                backgroundColor:
                                  r.status === "active"
                                    ? "#10B981"
                                    : r.status === "completed"
                                    ? "#4F46E5"
                                    : r.status === "canceled"
                                    ? "#DC2626"
                                    : "#6B7280", // expired
                                color: "white",
                                padding: "4px 8px",
                                borderRadius: "8px",
                                fontSize: "0.85rem",
                                fontWeight: "600",
                              }}
                            >
                              {r.status === "active"
                                ? "activa"
                                : r.status === "completed"
                                ? "completada"
                                : r.status === "canceled"
                                ? "cancelada"
                                : "expirada"}
                            </span>
                          </p>

                          {r.status === "active" && (
                            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                              <button
                                disabled={loading}
                                onClick={() => cancel(r.id)}
                                style={{
                                  ...styles.buttonSecondary,
                                  opacity: loading ? 0.6 : 1,
                                }}
                                onMouseEnter={(e) => {
                                  if (!loading) {
                                    e.target.style.backgroundColor = "#B91C1C";
                                    e.target.style.transform = "translateY(-1px)";
                                    e.target.style.boxShadow =
                                      "0 4px 12px rgba(220, 38, 38, 0.4)";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = "#DC2626";
                                  e.target.style.transform = "translateY(0)";
                                  e.target.style.boxShadow =
                                    "0 2px 8px rgba(220, 38, 38, 0.3)";
                                }}
                              >
                                Cancelar
                              </button>

                              <button
                                disabled={loading}
                                onClick={() => complete(r.id)}
                                style={{
                                  ...styles.button,
                                  opacity: loading ? 0.6 : 1,
                                  margin: 0,
                                }}
                                onMouseEnter={(e) => {
                                  if (!loading) {
                                    e.target.style.backgroundColor = "#5A56C4";
                                    e.target.style.transform = "translateY(-1px)";
                                    e.target.style.boxShadow =
                                      "0 4px 12px rgba(59, 56, 160, 0.4)";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = "#3B38A0";
                                  e.target.style.transform = "translateY(0)";
                                  e.target.style.boxShadow =
                                    "0 2px 8px rgba(59, 56, 160, 0.3)";
                                }}
                              >
                                Confirmar Recojo
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}


      {/* Notifications */}
        <h3
          style={styles.sectionTitle}
          onClick={() => setShowNotifications(!showNotifications)}
        >
          {showNotifications ? "▼" : "▶"} 🔔 Notificaciones
        </h3>

          {showNotifications && (
          <>
            {notifications.filter(n => !n.read).length === 0 ? (
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
                {notifications.filter(n => !n.read).map((note) => (
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
                    <span style={{ color: "#6b6b6b", fontSize: "0.85rem" }}>
                      {new Date(note.created_at).toLocaleString()}
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
                      Marcar como leído
                    </button>
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
