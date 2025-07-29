import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import {
  fetchRestaurantItems,
  createRestaurantItem,
  fetchNotifications,
  uploadItemImage,
  updateRestaurantItemImage,
  cancelRestaurantItem,
} from "../api.js";

export default function RestaurantDashboard({ user }) {
  const [form, setForm] = useState({
    information: "",
    pickup_time: "",
    total_spots: 1,
    price: 0,
    image: null,
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
      await cancelRestaurantItem(supabase, itemId); // ← Your API logic
      await loadItems(); // refresh after cancel
    } catch (err) {
      console.error("Failed to cancel item:", err);
      alert("Failed to cancel item: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };




  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-4">Restaurant Dashboard</h2>

      {/* Notifications */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3">Notifications</h3>
        {notifications.length === 0 ? (
          <p>No notifications yet.</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((note) => (
              <li key={note.id} className="text-gray-700">
                {note.message} —{" "}
                <span className="text-gray-500 text-sm">
                  {new Date(note.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Item Creation Form */}
      <form onSubmit={handleSubmit} className="mb-10 space-y-4 max-w-md">
        <input
          name="information"
          placeholder="Info"
          value={form.information}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          name="pickup_time"
          type="datetime-local"
          placeholder="Pick Up Time"
          value={form.pickup_time}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          name="total_spots"
          type="number"
          min="1"
          placeholder="Number of Servings"
          value={form.total_spots}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          name="price"
          type="number"
          step="0.01"
          placeholder="Price"
          value={form.price}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleChange}
          className="w-full"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Create Offer"}
        </button>
      </form>

      {/* Current Offers */}
      <h3 className="text-xl font-semibold mb-4">Your Current Offers</h3>
              {loading && <p>Loading offers…</p>}
              {error && <p className="text-red-600 mb-4">Error: {error}</p>}
              {!loading && !error && items.length === 0 && <p>No offers found.</p>}

        <div style={{ display: "grid", gap: "1rem" }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "1rem",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                display: "flex",
                gap: "1rem",
                alignItems: "center",
              }}
            >
              {/* Image on the left */}
              {item.image_url ? (
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
              ) : (
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    backgroundColor: "#e2e8f0", // light gray
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9ca3af", // gray text
                    fontSize: "0.875rem",
                    flexShrink: 0,
                  }}
                >
                  No Image
                </div>
              )}

              {/* Item details on the right */}
              <div>
                <h4 style={{ margin: "0 0 0.5rem" }}>{item.information}</h4>
                <p style={{ margin: "0.25rem 0" }}>
                  <strong>Pickup:</strong> {new Date(item.pickup_time).toLocaleString()}
                </p>
                <p style={{ margin: "0.25rem 0" }}>
                  <strong>Price:</strong> ${item.price.toFixed(2)} &nbsp;&nbsp;
                  <strong>Spots left:</strong> {item.total_spots - (item.num_of_reservations || 0)}
                </p>
                <p style={{ margin: "0.25rem 0" }}>
                  <strong>Location:</strong> {item.location}
                </p>
                <p style={{ margin: "0.25rem 0" }}>
                  <strong>Status:</strong> {item.status}
                </p>
                {/* Buttons */}
                {item.status === "active" && (
                  <button
                    onClick={() => handleCancel(item.id)}
                    className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Cancel Offer
                  </button>
              )}
              </div>
            </div>
          ))}
        </div>

    </div>
  );
}
