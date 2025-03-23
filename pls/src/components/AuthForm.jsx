import { useState, useEffect } from "react";

export default function AuthForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem("token");
      const storedUsername = localStorage.getItem("username");

      if (!token || !storedUsername) return;

      // Verify token with the backend
      const response = await fetch("http://localhost:6969/verify-token", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        setIsLoggedIn(true);
        onLogin(storedUsername);
      } else {
        // Token invalid - remove it and log out
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        setIsLoggedIn(false);
        onLogin(null);
      }
    };

    checkToken();
  }, [onLogin]);

  const register = async () => {
    const response = await fetch("http://localhost:6969/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    alert(data.message);
  };

  const login = async () => {
    const response = await fetch("http://localhost:6969/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", username);
      setIsLoggedIn(true);
      onLogin(username);
    } else {
      alert("Invalid credentials");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setIsLoggedIn(false);
    onLogin(null);
  };

  return (
    <div className="p-6 border rounded-lg space-y-4">
      <h2 className="text-2xl font-bold text-center">
        {isLoggedIn ? `Welcome, ${localStorage.getItem("username")}` : "Register / Login"}
      </h2>

      {!isLoggedIn ? (
        <>
          <input
            className="w-full p-3 border rounded-lg bg-gray-700 text-white"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="w-full p-3 border rounded-lg bg-gray-700 text-white"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full bg-blue-500 text-white p-3 rounded-lg" onClick={register}>
            Register
          </button>
          <button className="w-full bg-green-500 text-white p-3 rounded-lg" onClick={login}>
            Login
          </button>
        </>
      ) : (
        <button className="w-full bg-red-500 text-white p-3 rounded-lg" onClick={logout}>
          Logout
        </button>
      )}
    </div>
  );
}
