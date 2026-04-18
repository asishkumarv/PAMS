import { useNavigate } from "react-router-dom";

export default function Sidebar({ close }) {
  const nav = useNavigate();

  const logout = () => {
    localStorage.clear();
    nav("/");
  };

  const menu = [
    { name: "Dashboard", path: "/sdashboard" },
    { name: "Book Token", path: "/book-token" },
    { name: "Set Appointment", path: "/set-appointment" },
    
  ];

  return (
    <div className="h-full flex flex-col bg-white shadow-lg p-5 w-64">

      {/* 🔥 Mobile Close Button */}
      {close && (
        <button
          onClick={close}
          className="md:hidden mb-4 text-gray-500 text-sm"
        >
          ✖ Close
        </button>
      )}

      {/* Logo */}
      <h1 className="text-2xl font-bold text-blue-600 mb-8">
        PAMS
      </h1>

      {/* Menu */}
      <nav className="flex flex-col gap-2">

        {menu.map((item, i) => (
          <button
            key={i}
            onClick={() => {
              nav(item.path);
              close && close(); // close on mobile click
            }}
            className="text-left px-4 py-3 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition"
          >
            {item.name}
          </button>
        ))}

      </nav>

      {/* Logout */}
      <div className="mt-auto pt-6">
        <button
          onClick={logout}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl transition"
        >
          Logout
        </button>
      </div>

    </div>
  );
}