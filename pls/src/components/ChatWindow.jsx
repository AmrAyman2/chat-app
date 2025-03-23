import { useState, useEffect } from "react";

export default function ChatWindow({ username, receiver, socket }) {
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

  // Fetch messages when receiver changes
  useEffect(() => {
    if (!receiver) return;

    fetch(`http://localhost:6969/messages/${username}/${receiver}`)
      .then((res) => res.json())
      .then((data) => setChatMessages(data))
      .catch((err) => console.error("Failed to fetch messages:", err));
  }, [receiver, username]);

  // Listen for incoming messages
  useEffect(() => {
    const handleNewMessage = (msg) => {
      // Prevent duplicate messages
      setChatMessages((prev) => {
        if (prev.some((m) => m.sender === msg.sender && m.content === msg.content)) {
          return prev; // Don't add duplicates
        }
        return [...prev, msg];
      });
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, username, receiver]);

  const sendMessage = () => {
    if (!message.trim() || !receiver) return;

    const newMessage = { sender: username, receiver, content: message };

    // Send message to server
    socket.emit("send_message", newMessage);

    // Clear input field
    setMessage("");
  };

  return (
    <div className="flex flex-col flex-grow bg-gray-800 p-4 rounded-lg">
      <div className="flex-grow overflow-y-auto h-96 p-2 bg-gray-700 rounded-lg">
        {chatMessages.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 p-2 rounded-lg ${msg.sender === username ? "bg-blue-500" : "bg-gray-600"}`}
          >
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
        <button
          className="p-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}
