import { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "./supabaseClient";
import { API_BASE_URL } from "../api";

export default function CustomerDashboard({ user }) {
  const [items, setItems] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Get current JWT token from Supabase session (async)
  const getJwt = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) {
      console.error("Error getting session:", error.message);
      return null;
    }
    return session?.access_token || null;
  };

  const fetchItems = async () => {
    try {
      const token = await getJwt();
      if (!token) throw new Error("User not authenticated");

      const res = await axios.get(`${API_BASE_URL}/items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(res.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load items.");
    }
  };

  const fetchReservations = async () => {
    try {
      const token = await getJwt();
      if (!token) {
        setReservations([]);
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/reservations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReservations(res.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load your reservations.");
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchReservations();
    } else {
      setReservations([]);
    }
  }, [user?.id]);

  const reserve = async (item_id) => {
    if (!user?.id) {
      alert("You are not logged in.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await getJwt();
      if (!token) throw new Error("User not authenticated");

      const payload = {
        customer_id: user.id,
        item_id,
        timestamp: new Date().toISOString(),
        status: "active",
      };

      await axios.post(`${API_BASE_URL}/reservations`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("✅ Reservation created!");

      await fetchReservations();
      await fetchItems();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to create reservation.");
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
