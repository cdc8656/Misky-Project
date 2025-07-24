import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

export default function RestaurantDashboard({ user }) {
  const [form, setForm] = useState({
    information: "",
    pickup_time: "",
    total_spots: 1,
    price: 0,
  });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch items for this restaurant with RLS enforced
  const fetchItems = async () => {
    if (!user?.id) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("restaurant_id", user.id);

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
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

    try {
      const { data, error } = await supabase.from("items").insert([
        {
          restaurant_id: user.id,
          information: form.information,
          pickup_time: form.pickup_time,
          total_spots: parseInt(form.total_spots, 10),
          price: parseFloat(form.price),
        },
      ]);

      if (error) throw error;

      alert("Offer created!");
      setForm({
        information: "",
        pickup_time: "",
        total_spots: 1,
        price: 0,
      });
      fetchItems(); // refresh list
    } catch (err) {
      alert("Failed to create offer: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Restaurant Dashboard</h2>
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
          value={form.pickup_time}
          onChange={handleChange}
          required
        />
        <input
          name="total_spots"
          placeholder="Amount"
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
            Available spots: {item.total_spots - (item.num_of_reservations || 0)} <br />
            Pickup time: {new Date(item.pickup_time).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
