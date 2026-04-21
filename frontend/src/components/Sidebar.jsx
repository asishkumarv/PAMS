import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar({ close }) {
  const nav = useNavigate();
  const location = useLocation(); // 🔥 important

  const logout = () => {
    localStorage.clear();
    nav("/");
  };

  const menu = [
    { name: "Dashboard", path: "/sdashboard" },
    { name: "Book Token", path: "/book-token" },
    { name: "Set Appointment", path: "/set-appointment" },
    { name: "Send Message", path: "/send-message" },
  ];

  return (
    <div className="h-full flex flex-col bg-white shadow-lg p-5 w-64">

      {close && (
        <button
          onClick={close}
          className="md:hidden mb-4 text-gray-500 text-sm"
        >
          ✖ Close
        </button>
      )}

      <h1 className="text-2xl font-bold text-blue-600 mb-8">
        PAMS
      </h1>

      <nav className="flex flex-col gap-2">

        {menu.map((item, i) => {
          const isActive = location.pathname === item.path;

          return (
            <button
              key={i}
              onClick={() => {
                nav(item.path);
                close && close();
              }}
              className={`text-left px-4 py-3 rounded-xl transition ${
                isActive
                  ? "bg-blue-600 text-white shadow"
                  : "hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              {item.name}
            </button>
          );
        })}

      </nav>

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