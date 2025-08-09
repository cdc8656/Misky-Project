import axios from "axios"; //alows for HTTP requests to be made to FastAPI backend.

export const API_BASE_URL = "https://misky-project.onrender.com"; //base URL of FastAPI backend
//"http://localhost:8000"; //Local testing
//"https://misky-project.onrender.com"; //base URL of FastAPI backend

//get the access token
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



//USER FUNCTIONS

// Fetch the profile of the logged-in user
export const fetchUserProfile = async (supabase) => {
  const token = await getAccessToken(supabase);
  if (!token) throw new Error("No autenticado");

  try {
    const res = await axios.get(`${API_BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching profile:", err);
    throw new Error(err.response?.data?.detail || "Error en encontrar perfil");
  }
};

// Update profile information (name, location, contact, picture)
export const updateUserProfile = async (supabase, profileData) => {
  const token = await getAccessToken(supabase);
  if (!token) throw new Error("No autenticado");

  try {
    const res = await axios.patch(`${API_BASE_URL}/profile`, profileData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return res.data;
  } catch (err) {
    console.error("Error updating profile:", err);
    throw new Error(err.response?.data?.detail || "Error en actualizar perfil");
  }
};


// Mark a notification as read
export const markNotificationAsRead = async (supabase, notificationId) => {
  const token = await getAccessToken(supabase);
  if (!token) throw new Error("No autenticado");

  if (!API_BASE_URL) throw new Error("Backend URL is not defined");

  try {
    const res = await axios.patch(
      `${API_BASE_URL}/notifications/${notificationId}/read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  } catch (err) {
    console.error("Error marking notification as read:", err);
    throw new Error(err.response?.data?.detail || "Error al marcar notificación como leída");
  }
};



//CUSTOMER FUNCTIONS
// Fetch all available food items (for customers)
export const fetchItems = async (supabase) => {
  //Gets the access token. If the user is not logged in, throws an error
  const token = await getAccessToken(supabase);
  if (!token) throw new Error("No autenticado");

  try {
    const res = await axios.get(`${API_BASE_URL}/items`, { // Make a GET request to the /items route in FastAPI backend
      headers: { Authorization: `Bearer ${token}` }, // with an Authorization header
    });
    return res.data; //Returns the data from the response (the food items)
  }
  //If the request fails, logs the error and throws a readable error 
  catch (err) {
    console.error("Error fetching items:", err);
    throw new Error(err.response?.data?.detail || "Error encontrando oferta");
  }
};

// Create a reservation
export const createReservation = async (supabase, payload) => {
  const token = await getAccessToken(supabase);
  if (!token) throw new Error("No autenticado");

  try {
    // Log the payload for debugging (optional, remove in production)
    console.log("Sending reservation payload:", payload);

    // Ensure quantity is sent — fallback to 1 if not provided
    const fullPayload = {
      ...payload,
      quantity: payload.quantity || 1,
    };

    const res = await axios.post(`${API_BASE_URL}/reservations`, fullPayload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return res.data;
  } catch (err) {
    console.error("Error creating reservation:", err);
    throw new Error(err.response?.data?.detail || "Error en crear reservación!");
  }
};


// Get user reservations
export const fetchReservations = async (supabase) => {
  //Gets the access token. If the user is not logged in, throws an error
  const token = await getAccessToken(supabase);
  if (!token) throw new Error("No autenticado");

  try {
    const res = await axios.get(`${API_BASE_URL}/reservations`, { //Make a GET request /reservations to retrieve reservations for the authenticated user.
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; //Returns the data from the response
  } 
  // Logs and throws an error message if the reservation creation fails
  catch (err) {
    console.error("Error fetching reservations:", err);
    throw new Error(err.response?.data?.detail || "Error encontrando reservación");
  }
};

// Cancel a reservation
export const cancelReservation = async (supabase, reservation_id) => {
  const session = await supabase.auth.getSession();
  const token = session.data?.session?.access_token;

  if (!token) throw new Error("No auth token found.");

  const response = await fetch(`${API_BASE_URL}/reservations/${reservation_id}/cancel`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error en cancelar.");
  }

  return await response.json();
};


// Confirm a reservation
export const completeReservation = async (supabase, reservation_id) => {
  const session = await supabase.auth.getSession();
  const token = session.data?.session?.access_token;

  if (!token) throw new Error("No se encontró el token de autenticación.");

  const response = await fetch(`${API_BASE_URL}/reservations/${reservation_id}/complete`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error en completar.");
  }

  return await response.json();
};





//RESTAURANT FUNCTIONS

// Fetch items created by the logged-in restaurant
export const fetchRestaurantItems = async (supabase) => {
  const token = await getAccessToken(supabase);
  if (!token) throw new Error("No autenticado");

  try {
    const res = await axios.get(`${API_BASE_URL}/restaurant/items`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching restaurant items:", err);
    throw new Error(err.response?.data?.detail || "Error encontrando oferta");
  }
};

// Create a new food offer by the restaurant
export const createRestaurantItem = async (supabase, itemData) => {
  const token = await getAccessToken(supabase);
  if (!token) throw new Error("No autenticado");

  try {
    const res = await axios.post(`${API_BASE_URL}/restaurant/items`, itemData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    // If res.data is a list, return the first item
    if (Array.isArray(res.data)) {
      return res.data[0];
    }
    return res.data;
  } catch (err) {
    console.error("Error creating restaurant item:", err);
    throw new Error(err.response?.data?.detail || "Error creando oferta");
  }
};

// Cancel a restaurant item
export const cancelRestaurantItem = async (supabase, itemId) => {
  const token = await getAccessToken(supabase);
  if (!token) throw new Error("No autenticado");

  try {
    const res = await axios.patch(
      `${API_BASE_URL}/restaurant/items/${itemId}/cancel`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  } catch (err) {
    console.error("Error canceling restaurant item:", err);
    throw new Error(err.response?.data?.detail || "Error en cancelar oferta");
  }
};

// Complete a restaurant item
export const completeRestaurantItem = async (supabase, itemId) => {
  const token = await getAccessToken(supabase);
  if (!token) throw new Error("No autenticado");

  try {
    const res = await axios.patch(
      `${API_BASE_URL}/restaurant/items/${itemId}/complete`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  } catch (err) {
    console.error("Error completing restaurant item:", err);
    throw new Error(err.response?.data?.detail || "Error en completar oferta");
  }
};


// Upload an image to Supabase Storage and return its public URL
export const uploadItemImage = async (supabase, file, itemId) => {
  if (!file) throw new Error("Error encontrando archivo");

  const fileExt = file.name.split(".").pop();
  const filePath = `item-images/${itemId}-${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from("item-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    throw new Error("Error en subir imagen: " + error.message);
  }

  const { data } = supabase.storage.from("item-images").getPublicUrl(filePath);
  return data.publicUrl;
};

// Update the restaurant item with the uploaded image URL
export const updateRestaurantItemImage = async (itemId, imageUrl, supabase) => {
  const token = await getAccessToken(supabase);
  if (!token) throw new Error("No autenticado");

  try {
    const res = await axios.patch(
      `${API_BASE_URL}/restaurant/items/${itemId}`, // Make sure this matches your backend route!
      { image_url: imageUrl },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (err) {
    console.error("Error updating restaurant item image:", err);
    throw new Error(err.response?.data?.detail || "Errors actualizando imagen");
  }
};


// get profile picture for restaurant item creation
export const getProfilePicture = async (supabase) => {
  const token = await getAccessToken(supabase);
  if (!token) throw new Error("No autenticado");

  try {
    const res = await axios.get(`${API_BASE_URL}/profile/picture`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data.profile_picture;
  } catch (err) {
    console.error("Error fetching profile picture:", err);
    throw new Error(
      err.response?.data?.detail || "Error en encontrar foto de perfil"
    );
  }
};




// Fetch notifications for the logged-in user (restaurant or customer)
export const fetchNotifications = async (supabase) => {
  const token = await getAccessToken(supabase);
  if (!token) throw new Error("No autenticado");

  try {
    const response = await axios.get(`${API_BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // The backend returns notifications filtered by role from the appropriate table
    return response.data; // array of notifications for this user
  } catch (err) {
    console.error("Error fetching notifications:", err);
    throw new Error(err.response?.data?.detail || "Error encontrando notificación");
  }
};


// (Optional) Create a notification (mostly for admin/testing purposes)
export const createNotification = async (supabase, notificationData) => {
  const token = await getAccessToken(supabase);
  if (!token) throw new Error("No autenticado");

  try {
    const res = await axios.post(`${API_BASE_URL}/notifications`, notificationData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (err) {
    console.error("Error creating notification:", err);
    throw new Error(err.response?.data?.detail || "Error en crear notificación");
  }
};


export const uploadProfilePicture = async (supabase, file, userId) => {
  if (!file) throw new Error("No file provided");

  const fileExt = file.name.split(".").pop();
  const filePath = `item-images/${userId}-profile-${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from("item-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    throw new Error("Failed to upload image: " + error.message);
  }

  const { data } = supabase.storage.from("item-images").getPublicUrl(filePath);
  return data.publicUrl;
};

export const updateProfilePictureUrl = async (supabase, imageUrl) => {
  const token = await getAccessToken(supabase);
  if (!token) throw new Error("No autenticado");

  try {
    const res = await axios.patch(
      `${API_BASE_URL}/profile/picture`,
      { profile_picture: imageUrl },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (err) {
    console.error("Error updating profile picture URL:", err);
    throw new Error(
      err.response?.data?.detail || "Error en actualizar foto de perfil"
    );
  }
};
