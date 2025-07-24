import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function ItemsList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error, status, statusText } = await supabase
        .from("items")
        .select("*");

      if (error) {
        // Log detailed error info
        console.error("Supabase error:", error);
        setError(error.message || "Failed to fetch food offers");
        setItems([]);
      } else {
        setItems(data || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError(err.message || "Failed to fetch food offers");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  if (loading) return <p>Loading food offers…</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  // Filter items with available spots
  const availableItems = items.filter(
    (item) => (item.total_spots - (item.num_of_reservations || 0)) > 0
  );

  return (
    <div>
      <h2>Available Food Offers</h2>

      {availableItems.length === 0 ? (
        <p>No available food offers at the moment.</p>
      ) : (
        <ul>
          {availableItems.map((item) => (
            <li key={item.id}>
              <strong>{item.information}</strong> <br />
              Price: ${item.price.toFixed(2)} <br />
              Available spots: {item.total_spots - (item.num_of_reservations || 0)} <br />
              Pickup time: {new Date(item.pickup_time).toLocaleString()} <br />
              Location: {item.location} <br />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
