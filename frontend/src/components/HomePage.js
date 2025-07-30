import React from "react";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: "#B2B0E8", minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
      {/* Header: Logo + Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 40px",
          backgroundColor: "#1A2A80",
        }}
      >
        <img
          src="/Misky Logo.png"
          alt="Misky Logo"
          style={{ width: "100px", height: "auto" }}
        />

        <div>
          <button
            onClick={() => navigate("/login")}
            style={{
              backgroundColor: "#3B38A0",
              color: "white",
              border: "none",
              padding: "10px 20px",
              marginRight: "10px",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#7A85C1")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#3B38A0")}
          >
            Login
          </button>
          <button
            onClick={() => navigate("/register")}
            style={{
              backgroundColor: "#3B38A0",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#7A85C1")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#3B38A0")}
          >
            Register
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ textAlign: "center", marginTop: "80px", color: "#1A2A80" }}>
        <h1>
          Welcome to the Misky Food Reservation App
        </h1>
        <h5 style={{ color: "#3B38A0", maxWidth: "600px", margin: "20px auto" }}>
          Remember the time Rey gave me 20 whole United States Dollars to go to the nearest homeless shelter to help the people in need?
        </h5>
        <h1>
          Our Mission
        </h1>
        <h5 style={{ color: "#3B38A0", maxWidth: "600px", margin: "20px auto" }}>
          This app is for the Peruvian Gooners and Gamers
        </h5>
        <h1>
          About Us
        </h1>
        <h5 style={{ color: "#3B38A0", maxWidth: "600px", margin: "20px auto" }}>
          Like and Subscribe
        </h5>
      </div>
    </div>
  );
}
