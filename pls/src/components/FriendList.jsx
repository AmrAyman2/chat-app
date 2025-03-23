import { useState, useEffect } from "react";

export default function FriendList({ username, onSelectFriend }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await fetch(`http://localhost:5000/users/${username}`);
      const data = await response.json();
      setUsers(data);
    };

    fetchUsers();
  }, [username]);

  return (
    <div className="w-1/3 bg-gray-800 p-4 h-full overflow-y-auto">
      <h3 className="text-xl font-bold mb-4">Users</h3>
      <ul className="space-y-2">
        {users.map((user, index) => (
          <li
            key={index}
            className="p-2 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600"
            onClick={() => onSelectFriend(user)}
          >
            {user}
          </li>
        ))}
      </ul>
    </div>
  );
}
