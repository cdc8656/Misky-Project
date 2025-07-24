import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { fetchItems, fetchReservations, createReservation } from "../api";

export default function CustomerDashboard({ user }) {
  const [items, setItems] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load available items
  const loadItems = async () => {
    try {
      const data = await fetchItems(supabase);
      setItems(data);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load items.");
    }
  };

  // Load user reservations
  const loadReservations = async () => {
    try {
      if (!user?.id) {
        setReservations([]);
        return;
      }
      const data = await fetchReservations(supabase);
      setReservations(data);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load your reservations.");
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    loadReservations();
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
      const payload = {
        customer_id: user.id,
        item_id,
        timestamp: new Date().toISOString(),
        status: "active",
      };

      await createReservation(supabase, payload);

      alert("✅ Reservation created!");

      await loadReservations();
      await loadItems();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create reservation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Customer Dashboard</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading && <p>Processing reservation…</p>}

      <h3>Available Food Offers</h3>
      {items.filter((item) => (item.total_spots - (item.num_of_reservations || 0)) > 0).length === 0 ? (
        <p>No available food offers at the moment.</p>
      ) : (
        <ul>
          {items
            .filter((item) => (item.total_spots - (item.num_of_reservations || 0)) > 0)
            .map((item) => (
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
