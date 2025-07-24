//NOTES: ItemList.js talks to Supabase directly, doesn't go through fastAPI backend
//This page will probably be removed to suit homepage needs

import { useEffect, useState } from "react"; //useEffect: runs side-effects (e.g., fetching data after component mounts), useState: allows you to create reactive variables (items, loading, etc.)
import { supabase } from "./supabaseClient"; //initialize Supabase client, used to get the user session and token

export default function ItemsList() { //reusable React component called ItemsList which fetches and displays a list of available food offers.
  const [items, setItems] = useState([]); //items stores the array of food offers fetched from Supabase, setItems is the setter function to update that state.
  const [loading, setLoading] = useState(true); //loading tracks if app is currently fetching data
  const [error, setError] = useState(null); //error messaging if error encountered during processes

  const fetchItems = async () => { //data retrieval from the items table in Supabase.
    setLoading(true); //begin loading
    setError(null);

    try {
      const { data, error, status, statusText } = await supabase //queries all rows (select("*")) from the "items" table, returns a result object with keys: data (fetched items), error, status, and statusText
        .from("items")
        .select("*");

      if (error) {
        // Log detailed error info
        console.error("Supabase error:", error);
        setError(error.message || "Failed to fetch food offers");
        setItems([]);
      } 
      else { //if no error, items state is set to the data returned
        setItems(data || []);
      }
    //handle errors
    } catch (err) {
      console.error("Unexpected error:", err);
      setError(err.message || "Failed to fetch food offers");
      setItems([]);
    } finally {
      setLoading(false); //data is fetched, therefore loading is done
    }
  };

  useEffect(() => { //runs fetchItems() once, when the component mounts
    fetchItems();
  }, []);


// UI component
  if (loading) return <p>Loading food offers…</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  // Filter items with available spots
  const availableItems = items.filter(
    (item) => (item.total_spots - (item.num_of_reservations || 0)) > 0
  );

  //HTML component
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
