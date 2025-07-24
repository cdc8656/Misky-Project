import axios from "axios"; //alows for HTTP requests to be made to FastAPI backend.

export const API_BASE_URL = "https://misky-project.onrender.com"; //base URL of FastAPI backend

export const getAccessToken = async (supabase) => { //supabase.auth.getSession() to fetch the current user's session, which includes the access token if logged in
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Error fetching session:", error.message);
    return null;
  }

  return session?.access_token || null; // returns the access token, which is needed to authenticate API requests to your backend
};

// Fetch all available food items (for customers)
export const fetchItems = async (supabase) => {
  //Gets the access token. If the user is not logged in, throws an error
  const token = await getAccessToken(supabase);
  if (!token) throw new Error("Not authenticated");

  try {
    const res = await axios.get(`${API_BASE_URL}/items`, { // Make a GET request to the /items route in FastAPI backend
      headers: { Authorization: `Bearer ${token}` }, // with an Authorization header
    });
    return res.data; //Returns the data from the response (the food items)
  }
  //If the request fails, logs the error and throws a readable error 
  catch (err) {
    console.error("Error fetching items:", err);
    throw new Error(err.response?.data?.detail || "Failed to fetch items");
  }
};

// Create a reservation
export const createReservation = async (supabase, payload) => {
  //Gets the access token. If the user is not logged in, throws an error
  const token = await getAccessToken(supabase);
  if (!token) throw new Error("Not authenticated");

  try {
    const res = await axios.post(`${API_BASE_URL}/reservations`, payload, { //Sends a POST request to /reservations with the reservation data in the body
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; //Returns the data from the response
  } 
  //Logs and throws an error message if the reservation creation fails
  catch (err) {
    console.error("Error creating reservation:", err);
    throw new Error(err.response?.data?.detail || "Failed to create reservation");
  }
};

// Get user reservations
export const fetchReservations = async (supabase) => {
  //Gets the access token. If the user is not logged in, throws an error
  const token = await getAccessToken(supabase);
  if (!token) throw new Error("Not authenticated");

  try {
    const res = await axios.get(`${API_BASE_URL}/reservations`, { //Make a GET request /reservations to retrieve reservations for the authenticated user.
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; //Returns the data from the response
  } 
  // Logs and throws an error message if the reservation creation fails
  catch (err) {
    console.error("Error fetching reservations:", err);
    throw new Error(err.response?.data?.detail || "Failed to fetch reservations");
  }
};
