import { useState, useEffect } from "react";

export default function ChatWindow({ username, receiver, socket }) {
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    if (!receiver) return;

    fetch(`http://localhost:5000/messages/${username}/${receiver}`)
      .then((res) => res.json())
      .then((data) => setChatMessages(data))
      .catch((err) => console.error("Failed to fetch messages:", err));
  }, [receiver]);

  useEffect(() => {
    socket.on("new_message", (msg) => {
      if (
        (msg.sender === username && msg.receiver === receiver) ||
        (msg.sender === receiver && msg.receiver === username)
      ) {
        setChatMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off("new_message");
    };
  }, [socket, username, receiver]);

  const sendMessage = () => {
    if (!message.trim() || !receiver) return;

    const newMessage = { sender: username, receiver, content: message };

    // Optimistically add message to UI
    setChatMessages((prev) => [...prev, newMessage]);

    // Send message to server
    socket.emit("send_message", newMessage);

    // Clear input field
    setMessage("");
  };

  return (
    <div className="flex flex-col flex-grow bg-gray-800 p-4 rounded-lg">
      <div className="flex-grow overflow-y-auto h-96 p-2 bg-gray-700 rounded-lg">
        {chatMessages.map((msg, index) => (
          <div key={index} className="mb-2 p-2 rounded-lg" style={{ backgroundColor: msg.sender === username ? "blue" : "gray" }}>
            <strong>{msg.sender === username ? "You" : msg.sender}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <div className="flex mt-2">
        <input
          className="flex-grow p-2 rounded-l-lg bg-gray-700 text-white border-none outline-none"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className="p-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}
