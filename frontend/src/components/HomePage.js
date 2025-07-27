// src/components/HomePage.js
import React from "react";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Welcome to the Food Reservation App</h1>
      <p1>Remember the time rey gave me 20 whole United States Dollars to go to nearest homeless shelter to help the people in need? </p1>
      <br></br>
      <button onClick={() => navigate("/login")} style={{ margin: "10px" }}>
        Login
      </button>
      <button onClick={() => navigate("/register")} style={{ margin: "10px" }}>
        Register
      </button>
    </div>
  );
}