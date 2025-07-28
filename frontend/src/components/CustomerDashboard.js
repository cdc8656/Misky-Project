//NOTES: CustomerDashboard.js goes through fastAPI backend, doesn't talk directly to Supabase


import { useEffect, useState } from "react"; //useEffect: runs side-effects (e.g., fetching data after component mounts), useState: allows you to create reactive variables (items, loading, etc.)
import { supabase } from "./supabaseClient"; //initialize Supabase client, used to get the user session and token
import { fetchItems, fetchReservations, createReservation, cancelReservation } from "../api"; //helper functions that make HTTP requests to FastAPI backend

export default function CustomerDashboard({ user }) { //main react component
  //state setup
  const [items, setItems] = useState([]); //food items pulled from the backend
  const [reservations, setReservations] = useState([]); //current user’s reservations
  const [loading, setLoading] = useState(false); //loading tracks if app is currently fetching data
  const [error, setError] = useState(""); //error messaging if error encountered during processes
  const [searchTerm, setSearchTerm] = useState(""); //search terms

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

  useEffect(() => {
    loadItems(); 
  }, []); //Run loadItems() when the component first mounts (empty [] dependency)

  useEffect(() => {
    loadReservations();
  }, [user?.id]); //Re-fetch reservations when the user logs in or changes

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


  //Filter items based on search input
  const filteredItems = items
    .filter(item => (item.total_spots - (item.num_of_reservations || 0)) > 0)
    .filter(item =>
      item.information.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase())
    );


// UI/HTML Portion
  return (
    <div>
      <h2>Customer Dashboard</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading && <p>Processing reservation…</p>}

      {/*Search input*/}
      <input
        type="text"
        placeholder="Search food or restaurant location..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: "1rem", padding: "0.5rem", width: "100%" }}
      />

      <h3>Available Food Offers</h3>
      {filteredItems.length === 0 ? (
        <p>No matching food offers at the moment.</p>
      ) : (
        <ul>
          {filteredItems.map((item) => (
            <li key={item.id} style={{ marginBottom: "0.5rem" }}>
              <strong>{item.information}</strong> —{" "}
              {new Date(item.pickup_time).toLocaleString()} — $
              {item.price.toFixed(2)} — spots:{" "}
              {item.total_spots - (item.num_of_reservations || 0)} <br />
              Location: {item.location} <br />
              <button disabled={loading} onClick={() => reserve(item.id)}>
                Reserve
              </button>
            </li>
          ))}
        </ul>
      )}


      <h3>Your Reservations</h3> 
      {reservations.length === 0 ? (
        <p>You have no reservations yet.</p>
      ) : (
        <ul>
          {reservations.map((r) => (
            <li key={r.id} style={{ marginBottom: "0.5rem" }}>
              <strong>{r.item.information}</strong> —{" "}
              {new Date(r.item.pickup_time).toLocaleString()} — $
              {r.item.price.toFixed(2)} — Status: {r.status} <br />
              Location: <strong>{r.item.location}</strong> <br />
              {r.status === "active" && (
                  <button disabled={loading} onClick={() => cancel(r.id)}>
                    Cancel
                  </button>
                )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
