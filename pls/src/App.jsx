import { useState, useEffect } from "react";
import io from "socket.io-client";
import AuthForm from "./components/AuthForm";
import FriendList from "./components/FriendList";
import ChatWindow from "./components/ChatWindow";

const socket = io("http://localhost:5000");

export default function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [users, setUsers] = useState([]);
  const [receiver, setReceiver] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (loggedIn) {
      socket.emit("join", { username });
      socket.on("new_message", (msg) => {
        setMessages((prev) => [...prev, msg]);
      });
      fetchUsers();
    }
  }, [loggedIn]);

  const fetchUsers = async () => {
    const response = await fetch("http://localhost:5000/users");
    const data = await response.json();
    setUsers(data);
  };

  const handleLogin = async (user) => {
    setUsername(user);
    setLoggedIn(true);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
      {!loggedIn ? (
        <AuthForm onLogin={handleLogin} />
      ) : (
        <div className="flex w-full h-screen p-4 space-x-4">
          <FriendList users={users} onSelectFriend={setReceiver} username={username} />
          <ChatWindow username={username} receiver={receiver} messages={messages} socket={socket} />
        </div>
      )}
    </div>
  );
}
