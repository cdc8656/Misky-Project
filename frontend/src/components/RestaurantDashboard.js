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



return (
<div
  style={{ backgroundColor: "#B2B0E8", minHeight: "100vh", paddingBottom: "40px" }}
  className="max-w-5xl mx-auto px-4 py-6"
>
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
          Restaurant Dashboard
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

      {/* Notifications */}
      <div className="mb-8">
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
                  <li key={note.id} className="text-gray-700">
                    {note.message} —{" "}
                    <span className="text-gray-500 text-sm">
                      {new Date(note.created_at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Item Creation Form */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3" style={{ color: "#1A2A80" }}>
          Item Creation Form
        </h3>
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
            onMouseOver={(e) => (e.target.style.backgroundColor = "#7A85C1")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#3B38A0")}
            style={{
              backgroundColor: "#3B38A0",
              color: "#fff",
              border: "none",
              padding: "6px 12px",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "background-color 0.3s ease",
              minWidth: "80px",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? "Submitting..." : "Create Offer"}
          </button>
        </form>
      </div>

      {/* Current Offers */}
      <h3
        className="text-xl font-semibold mb-4 cursor-pointer"
        style={{ color: "#1A2A80" }}
        onClick={() => setShowOffers(!showOffers)}
      >
        {showOffers ? "▼ " : "▶ "} Your Current Food Offers
      </h3>

      {showOffers && (
        <>
          {loading && <p>Loading offers…</p>}
          {error && <p className="text-red-600 mb-4">Error: {error}</p>}
          {!loading && !error && items.length === 0 && <p>No offers found.</p>}

          {!loading && !error && items.length > 0 && (
            <div className="grid gap-4">
              {items.map((item) => (
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
                  {/* Image */}
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
                        backgroundColor: "#e2e8f0",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#9ca3af",
                        fontSize: "0.875rem",
                        flexShrink: 0,
                      }}
                    >
                      No Image
                    </div>
                  )}

                  {/* Details */}
                  <div style={{ color: "#1A2A80", flex: 1 }}>
                    <h4 style={{ margin: "0 0 0.5rem" }}>{item.information}</h4>
                    <p style={{ margin: "0.25rem 0" }}>
                      <strong>Pickup:</strong> {new Date(item.pickup_time).toLocaleString()}
                    </p>
                    <p style={{ margin: "0.25rem 0" }}>
                      <strong>Price:</strong> <b>S/.</b>{item.price.toFixed(2)} &nbsp;&nbsp;
                      <strong>Spots left:</strong>{" "}
                      {item.total_spots - (item.num_of_reservations || 0)}
                    </p>
                    <p style={{ margin: "0.25rem 0" }}>
                      <strong>Location:</strong> {item.location}
                    </p>
                    <p style={{ margin: "0.25rem 0" }}>
                      <strong>Status:</strong> {item.status}
                    </p>

                    {/* Action Buttons */}
                    {item.status === "active" && (
                      <div className="flex" style={{ marginTop: "0.5rem" }}>
                        <button
                          disabled={loading}
                          onClick={() => handleCancel(item.id)}
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
                          Cancel Offer
                        </button>
                        <button
                          disabled={loading}
                          onClick={() => handleComplete(item.id)}
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
                          Complete Offer
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
  );
}
