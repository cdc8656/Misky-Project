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
  fetchNotifications } from "../api"; //helper functions that make HTTP requests to FastAPI backend

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
  const reserve = async (item_id) => { // Called when the user clicks the Reserve button for a food item
    if (!user?.id) { //check to prevent unauthorized access
      alert("You are not logged in.");
      return;
    }

    setLoading(true);
    setError("");

    try {

      //Build a payload object to send to backend
      const payload = {
        customer_id: user.id,
        item_id,
        timestamp: new Date().toISOString(),
        status: "active",
      };

      //createReservation() sends a POST to your FastAPI backend with a bearer token
      await createReservation(supabase, payload); 

      alert("Reservation created!"); //success popup

      //Re-fetch reservations and item counts to reflect the new state (update whats shown on dashboard)
      await loadReservations(); 
      await loadItems();

    // handle errors
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create reservation.");
    } finally {
      setLoading(false);
    }
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





  //Filter items based on search input
  const filteredItems = items
    .filter(item => (item.total_spots - (item.num_of_reservations || 0)) > 0)
    .filter(item => (item.status == "active"))
    .filter(item =>
      item.information.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase())
    );


// UI/HTML Portion
return (
  <div style={{ backgroundColor: "#B2B0E8", minHeight: "100vh", paddingBottom: "40px" }} className="max-w-5xl mx-auto px-4 py-6">

  {/* Header Section with Logo, Title, and Profile Button */}
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 0",
    }}
  >
    {/* Logo */}
    <img
      src="/Misky Logo.png"
      alt="Misky Logo"
      style={{ width: "75px", height: "auto" }}
    />

    {/* Title */}
    <h2
      className="text-2xl font-bold"
      style={{
        color: "#1A2A80",
        flexGrow: 1,
        textAlign: "center",
        margin: 0,
      }}
    >
      Customer Dashboard
    </h2>

    {/* Profile Button */}
    <Link
      to="/profile"
      style={{
        backgroundColor: "#3B38A0",
        color: "#FFFFFF",
        padding: "8px 16px",
        borderRadius: "5px",
        textDecoration: "none",
        marginLeft: "auto",
      }}
      onMouseOver={(e) => (e.target.style.backgroundColor = "#7A85C1")}
      onMouseOut={(e) => (e.target.style.backgroundColor = "#3B38A0")}
    >
      Profile
    </Link>
  </div>

    {error && <p className="text-red-500">{error}</p>}
    {loading && <p>Processing reservation…</p>}
    {/* Search Section */}
      <h2
        className="text-2xl font-bold"
        style={{
          color: "#1A2A80",
          flexGrow: 1,
          textAlign: "Left",
          margin: 0,
        }}
      >
        Search for Offers
      </h2>
    {/* Search input */}
    <div className="w-screen px-4 sm:px-8">
      <input
        type="text"
        placeholder="Search food or restaurant location..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full mb-6 rounded border border-gray-300 text-left"
        style={{
          padding: "12px 16px",
          fontSize: "1.125rem",
          boxSizing: "border-box"
        }}
      />
    </div>

    {/* === AVAILABLE FOOD OFFERS === */}
    <h3
      className="text-xl font-semibold mb-4 cursor-pointer"
      style={{ color: "#1A2A80" }}
      onClick={() => setShowOffers(!showOffers)}
    >
      {showOffers ? "▼ " : "▶ "}Available Food Offers
    </h3>
    {showOffers && (
      <>
        {filteredItems.length === 0 ? (
          <p>No matching food offers at the moment.</p>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "2px solid #3B38A0",
                  borderRadius: "8px",
                  padding: "1rem",
                  backgroundColor: "#FFFFFF",
                  display: "flex",
                  gap: "1rem",
                  alignItems: "center",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                }}
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.information}
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      flexShrink: 0,
                    }}
                  />
                )}

                <div style={{ color: "#1A2A80" }}>
                  <h4 style={{ margin: "0 0 0.5rem" }}>{item.information}</h4>
                  <p>
                    <strong>Pickup:</strong> {new Date(item.pickup_time).toLocaleString()}
                  </p>
                  <p>
                    <strong>Price:</strong> <b>S/.</b>
                    {item.price.toFixed(2)} &nbsp;&nbsp;
                    <strong>Spots left:</strong>{" "}
                    {item.total_spots - (item.num_of_reservations || 0)}
                  </p>
                  <p>
                    <strong>Location:</strong> {item.location}
                  </p>
                  <button
                    disabled={loading}
                    onClick={() => reserve(item.id)}
                    style={{
                      marginTop: "0.5rem",
                      backgroundColor: "#3B38A0",
                      color: "#fff",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                    onMouseOver={(e) => (e.target.style.backgroundColor = "#7A85C1")}
                    onMouseOut={(e) => (e.target.style.backgroundColor = "#3B38A0")}
                  >
                    Reserve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    )}

    {/* === CUSTOMER RESERVATIONS === */}
    <h3
      className="text-xl font-semibold mt-10 mb-4 cursor-pointer"
      style={{ color: "#1A2A80" }}
      onClick={() => setShowReservations(!showReservations)}
    >
      {showReservations ? "▼ " : "▶ "}Your Reservations
    </h3>
    {showReservations && (
      <>
        {reservations.length === 0 ? (
          <p>You have no reservations yet.</p>
        ) : (
          <ul className="space-y-4">
            {reservations.map((r) => (
              <li
                key={r.id}
                style={{
                  backgroundColor: "#fff",
                  padding: "1rem",
                  borderRadius: "12px",
                  border: "2px solid #3B38A0",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                  color: "#1A2A80",
                }}
              >
                <h4 className="font-semibold text-lg mb-1">{r.item.information}</h4>
                <p>
                  <strong>Pickup Time:</strong> {new Date(r.item.pickup_time).toLocaleString()}
                </p>
                <p>
                  <strong>Price:</strong> <b>S/.</b>
                  {r.item.price.toFixed(2)}
                </p>
                <p>
                  <strong>Location:</strong> {r.item.location}
                </p>
                <p className="mb-3">
                  <strong>Status:</strong> {r.status}
                </p>

                {r.status === "active" && (
                  <div className="flex" style={{ marginTop: "0.5rem" }}>
                    <button
                      disabled={loading}
                      onClick={() => cancel(r.id)}
                      style={{
                        backgroundColor: "#DC2626",
                        color: "#fff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        transition: "background-color 0.3s ease",
                        marginRight: "12px",
                        minWidth: "80px",
                      }}
                      onMouseOver={(e) => (e.target.style.backgroundColor = "#B22222")}
                      onMouseOut={(e) => (e.target.style.backgroundColor = "#DC2626")}
                    >
                      Cancel
                    </button>

                    <button
                      disabled={loading}
                      onClick={() => complete(r.id)}
                      style={{
                        backgroundColor: "#3B38A0",
                        color: "#fff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        transition: "background-color 0.3s ease",
                        minWidth: "80px",
                      }}
                      onMouseOver={(e) => (e.target.style.backgroundColor = "#7A85C1")}
                      onMouseOut={(e) => (e.target.style.backgroundColor = "#3B38A0")}
                    >
                      Complete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </>
    )}

    {/* === NOTIFICATIONS === */}
    <h3
      className="text-xl font-semibold mt-10 mb-4 cursor-pointer"
      style={{ color: "#1A2A80" }}
      onClick={() => setShowNotifications(!showNotifications)}
    >
      {showNotifications ? "▼ " : "▶ "}Notifications
    </h3>
    {showNotifications && (
      <>
        {notifications.length === 0 ? (
          <p>No notifications yet.</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((note) => (
              <li
                key={note.id}
                className="p-3 rounded-md text-sm shadow"
                style={{ backgroundColor: "#FFF9C4", color: "#1A2A80" }}
              >
                {note.message}
                <span className="text-gray-600 block text-xs mt-1">
                  {new Date(note.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </>
    )}
  </div>
);

}
