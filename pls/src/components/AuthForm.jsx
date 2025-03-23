import { useState } from "react";

export default function AuthForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const register = async () => {
    const response = await fetch("http://localhost:5000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    alert(data.message);
  };

  const login = async () => {
    const response = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (response.ok) {
      onLogin(username);
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="p-6 border rounded-lg space-y-4">
      <h2 className="text-2xl font-bold text-center">Register / Login</h2>
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
    </div>
  );
}
