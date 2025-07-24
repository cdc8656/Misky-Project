//NOTES: RestaurantDashboard.js talks to Supabase directly, doesn't go through fastAPI backend

import { useState, useEffect } from "react"; //useEffect: runs side-effects (e.g., fetching data after component mounts), useState: allows you to create reactive variables (items, loading, etc.)
import { supabase } from "./supabaseClient"; //initialize Supabase client, used to get the user session and token

export default function RestaurantDashboard({ user }) { //main react component
  //state setup
  const [form, setForm] = useState({ //form state holds the data for a new food offer being created by the restauran
    information: "", //initialized with empty values
    pickup_time: "",
    total_spots: 1,
    price: 0,
  });
  const [items, setItems] = useState([]); //food items made by restaurant(pulled from the backend)
  const [loading, setLoading] = useState(false); //manages loading state for API calls
  const [error, setError] = useState(null); //stores error messages if any occur

  // Fetch items for this restaurant with RLS enforced
  const fetchItems = async () => {
    if (!user?.id) { //If no user is logged in, don’t try to fetch
      setItems([]);
      return;
    }

    setLoading(true); //begin loading state
    setError(null);

    try {
      const { data, error } = await supabase //Supabase query: fetches all rows from the items table, Filters them where restaurant_id matches the current user ID
        .from("items")
        .select("*")
        .eq("restaurant_id", user.id); //Filters them where restaurant_id matches the current user ID (also enforced by Supabase's RLS)
      
    //Handles success or error
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch items");
    } finally {
      setLoading(false); //ends loading state
    }
  };

  useEffect(() => { //Calls fetchItems() once on mount or when user.id changes.
    fetchItems();
  }, [user?.id]);

  const handleChange = (e) => { //Updates the corresponding form field when input changes.
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); //Prevents default form submission

    setLoading(true); //Begins loading state
    setError(null);

    try {
      const { data, error } = await supabase.from("items").insert([ //request to Supabase: Submits a new item to the items table using the form values
        {
          restaurant_id: user.id, //restaurant_id links the item to the current user.
          information: form.information,
          pickup_time: form.pickup_time,
          total_spots: parseInt(form.total_spots, 10), //Converts total_spots and price to numeric types
          price: parseFloat(form.price),
        },
      ]);

      if (error) throw error;

      alert("Offer created!"); //show success alert
      setForm({ //reset form after success
        information: "",
        pickup_time: "",
        total_spots: 1,
        price: 0,
      });
      fetchItems(); // refresh list
    } catch (err) {
      alert("Failed to create offer: " + (err.message || err));
    } finally {
      setLoading(false); //end loading state
    }
  };


  // UI / HTML Portion
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
