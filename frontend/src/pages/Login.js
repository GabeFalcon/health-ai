import React from "react";
import { auth, provider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import "./Login.css";

function Login({ onLogin }) {
  const handleLogin = () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
        onLogin(user); // Send user back to App
      })
      .catch((error) => {
        console.error("Login error:", error);
      });
  };

  return (
    <div className="login-container">
      <h1>Welcome to HealthAI</h1>
      <button onClick={handleLogin}>Sign in with Google</button>
    </div>
  );
}

export default Login;
