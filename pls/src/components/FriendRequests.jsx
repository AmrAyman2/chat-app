import { useEffect, useState } from "react";

export default function FriendRequests({ username, socket }) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      const response = await fetch(`http://localhost:6969/friend_requests/${username}`);
      const data = await response.json();
      setRequests(data);
    };

    fetchRequests();

    socket.on("friend_request", (data) => {
      setRequests((prev) => [...prev, { sender: data.sender, status: "pending" }]);
    });

    socket.on("friend_request_update", (data) => {
      if (data.status === "accepted") {
        setRequests((prev) => prev.filter((req) => req.sender !== data.sender));
      }
    });

    return () => {
      socket.off("friend_request");
      socket.off("friend_request_update");
    };
  }, [socket, username]);

  const respondToRequest = async (sender, action) => {
    await fetch("http://localhost:6969/respond_friend_request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender, receiver: username, action }),
    });

    setRequests((prev) => prev.filter((req) => req.sender !== sender));
  };

  return (
    <div>
      <h3>Friend Requests</h3>
      {requests.length === 0 ? <p>No friend requests</p> : null}
      {requests.map((req, index) => (
        <div key={index}>
          <p>{req.sender} wants to be friends</p>
          <button onClick={() => respondToRequest(req.sender, "accept")}>Accept</button>
          <button onClick={() => respondToRequest(req.sender, "reject")}>Reject</button>
        </div>
      ))}
    </div>
  );
}
