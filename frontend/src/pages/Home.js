import React, { useState, useEffect } from "react";
import "./Home.css";

function Home({ user, onSubmit, onLogout }) {
  const [age, setAge] = useState(() => localStorage.getItem("age") || "");
  const [healthType, setHealthType] = useState(() => localStorage.getItem("healthType") || "");
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("darkMode");
    return stored !== null ? stored === "true" : true;
  });

  useEffect(() => {
    localStorage.setItem("age", age);
    localStorage.setItem("healthType", healthType);
  }, [age, healthType]);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const ageNum = parseInt(age, 10);

    if (!age || !healthType) {
      alert("Please fill out all fields");
      return;
    }

    if (isNaN(ageNum) || ageNum < 0 || ageNum > 100) {
      alert("Please enter a valid age between 0 and 100");
      return;
    }

    onSubmit({ name: user.displayName, age: ageNum, healthType });
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Hello, {user.displayName}!</h2>
        <div>
          <button onClick={() => setDarkMode((prev) => !prev)} style={{ marginRight: "1rem" }}>
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
          <button onClick={onLogout}>Sign Out</button>
        </div>
      </div>

      <p>Let's get to know you better.</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Age: </label>
          <input
            type="number"
            min="0"
            max="100"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </div>

        <div style={{ marginTop: "1rem" }}>
          <label>Health Focus: </label>
          <select
            value={healthType}
            onChange={(e) => setHealthType(e.target.value)}
          >
            <option value="">Select</option>
            <option value="mental">Mental Health</option>
            <option value="physical">Physical Health</option>
          </select>
        </div>

        <button style={{ marginTop: "1rem" }} type="submit">
          Continue
        </button>
      </form>
    </div>
  );
}

export default Home;
