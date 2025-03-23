import { useEffect, useState } from "react";

export default function FriendList({ socket, username, onSelectFriend }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`http://localhost:6969/users/${username}`);
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();

    // Listen for new user registrations
    socket.on("user_registered", () => {
      fetchUsers();
    });

    return () => {
      socket.off("user_registered");
    };
  }, [username, socket]);

  return (
    <div className="w-1/4 p-4 border-r border-gray-700">
      <h2 className="text-xl font-bold mb-4">Friends</h2>
      {users.length === 0 ? (
        <p className="text-gray-400">No friends yet</p>
      ) : (
        <ul>
          {users.map((user) => (
            <li
              key={user}
              className="p-2 cursor-pointer hover:bg-gray-700 rounded"
              onClick={() => onSelectFriend(user)}
            >
              {user}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
