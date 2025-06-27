import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ChatBox from "./components/ChatBox";

function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [intakeData, setIntakeData] = useState(() => {
    const stored = localStorage.getItem("intakeData");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    if (intakeData) localStorage.setItem("intakeData", JSON.stringify(intakeData));
  }, [user, intakeData]);

  const handleLogout = () => {
    setUser(null);
    setIntakeData(null);
    localStorage.clear(); 
  };

  if (!user) return <Login onLogin={setUser} />;
  if (!intakeData) return <Home user={user} onSubmit={setIntakeData} onLogout={handleLogout} />;

  return <ChatBox intakeData={intakeData} onLogout={handleLogout} />;
}

export default App;
