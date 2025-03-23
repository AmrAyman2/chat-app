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
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");

    if (token && storedUsername) {
      setUsername(storedUsername);
      setLoggedIn(true);
      socket.emit("join", { username: storedUsername });
      fetchUsers();
    }
  }, []);

  useEffect(() => {
    if (loggedIn) {
      socket.on("new_message", (msg) => {
        setMessages((prev) => [...prev, msg]);
      });

      socket.on("user_registered", () => {
        fetchUsers();
      });

      fetchUsers();
    }

    return () => {
      socket.off("new_message");
      socket.off("user_registered");
    };
  }, [loggedIn]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:6969/users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleLogin = (user, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("username", user);
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
        <div className="flex flex-col w-full h-screen p-4 space-y-4">
          <button 
            className="bg-red-500 text-white px-4 py-2 rounded-lg self-end"
            onClick={handleLogout}
          >
            Logout
          </button>
          <div className="flex w-full h-full space-x-4">
            <FriendList users={users} onSelectFriend={setReceiver} username={username} socket={socket} />
            <ChatWindow username={username} receiver={receiver} messages={messages} socket={socket} />
          </div>
        </div>
      )}
    </div>
  );
}
