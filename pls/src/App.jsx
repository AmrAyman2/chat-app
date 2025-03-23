import { useState, useEffect } from "react";
import io from "socket.io-client";
import AuthForm from "./components/AuthForm";
import FriendList from "./components/FriendList";
import ChatWindow from "./components/ChatWindow";

const socket = io("http://localhost:6969");

export default function App() {
  const [username, setUsername] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [users, setUsers] = useState([]);
  const [receiver, setReceiver] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");

    if (storedToken && storedUsername) {
      verifyToken(storedToken, storedUsername);
    }
  }, []);

  const verifyToken = async (token, user) => {
    try {
      const response = await fetch("http://localhost:6969/protected", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setUsername(user);
        setLoggedIn(true);
        socket.emit("join", { username: user });
        fetchUsers();
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
      }
    } catch (error) {
      console.error("Token verification failed:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:6969/users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleLogin = (user, token) => {
    localStorage.setItem("username", user);
    localStorage.setItem("token", token);
    setUsername(user);
    setLoggedIn(true);
    socket.emit("join", { username: user });
    fetchUsers();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUsername("");
    setLoggedIn(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
      {!loggedIn ? (
        <AuthForm onLogin={handleLogin} />
      ) : (
        <div className="flex w-full h-screen p-4 space-x-4">
          <div className="absolute top-4 right-4">
            <button
              className="bg-red-500 text-white p-2 rounded-lg"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
          <FriendList users={users} onSelectFriend={setReceiver} username={username} />
          <ChatWindow username={username} receiver={receiver} messages={messages} socket={socket} />
        </div>
      )}
    </div>
  );
}
