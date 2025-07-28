import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import {
  fetchRestaurantItems,
  createRestaurantItem,
  fetchNotifications,
} from "../api.js";

export default function RestaurantDashboard({ user }) {
  const [form, setForm] = useState({
    information: "",
    pickup_time: "",
    total_spots: 1,
    price: 0,
  });

  const [items, setItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      setNotifications(data);
    } catch (error) {
      setError(error.message);
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    loadItems();
    loadNotifications();

    // Subscribe to real-time notifications for this restaurant (GOES THROUGH SUPABASE)
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
    };

    try {
      await createRestaurantItem(supabase, payload);
      alert("Offer created!");
      setForm({
        information: "",
        pickup_time: "",
        total_spots: 1,
        price: 0,
      });
      loadItems();
    } catch (err) {
      alert("Failed to create offer: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Restaurant Dashboard</h2>

      {/* Display notifications */}
      <div>
        <h3>Notifications</h3>
        {notifications.length === 0 && <p>No notifications yet.</p>}
        <ul>
          {notifications.map((note) => (
            <li key={note.id}>
              {note.message} —{" "}
              <span style={{ fontSize: "0.85em", color: "gray" }}>
                {new Date(note.created_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Item creation form */}
      <form onSubmit={handleSubmit}>
        <input
          name="information"
          placeholder="Info"
          value={form.information}
          onChange={handleChange}
          required
        />
        <input
          name="pickup_time"
          type="datetime-local"
          placeholder="Pick Up Time"
          value={form.pickup_time}
          onChange={handleChange}
          required
        />
        <input
          name="total_spots"
          placeholder="Number of Servings"
          type="number"
          min="1"
          value={form.total_spots}
          onChange={handleChange}
          required
        />
        <input
          name="price"
          placeholder="Price"
          type="number"
          step="0.01"
          value={form.price}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Create Offer"}
        </button>
      </form>

      <h3>Your Current Offers</h3>
      {loading && <p>Loading offers…</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {!loading && !error && items.length === 0 && <p>No offers found.</p>}
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <strong>{item.information}</strong> <br />
            Price: ${item.price.toFixed(2)} <br />
            Reservations Made: {item.num_of_reservations || 0} <br />
            Available spots:{" "}
            {item.total_spots - (item.num_of_reservations || 0)} <br />
            Pickup time: {new Date(item.pickup_time).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
