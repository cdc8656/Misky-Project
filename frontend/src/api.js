import axios from "axios";

export const API_BASE_URL = "https://misky-project.onrender.com";

export const getAccessToken = async (supabase) => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Error fetching session:", error.message);
    return null;
  }

  return session?.access_token || null;
};

// Fetch all available food items (for customers)
export const fetchItems = async (supabase) => {
  const token = await getAccessToken(supabase);
  if (!token) throw new Error("Not authenticated");

  try {
    const res = await axios.get(`${API_BASE_URL}/items`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching items:", err);
    throw new Error(err.response?.data?.detail || "Failed to fetch items");
  }
};

// Create a reservation
export const createReservation = async (supabase, payload) => {
  const token = await getAccessToken(supabase);
  if (!token) throw new Error("Not authenticated");

  try {
    const res = await axios.post(`${API_BASE_URL}/reservations`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    console.error("Error creating reservation:", err);
    throw new Error(err.response?.data?.detail || "Failed to create reservation");
  }
};

// Get user reservations
export const fetchReservations = async (supabase) => {
  const token = await getAccessToken(supabase);
  if (!token) throw new Error("Not authenticated");

  try {
    const res = await axios.get(`${API_BASE_URL}/reservations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching reservations:", err);
    throw new Error(err.response?.data?.detail || "Failed to fetch reservations");
  }
};
