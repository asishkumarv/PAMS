import { useNavigate, useLocation } from "react-router-dom";

export default function PatientSidebar({ close }) {
  const nav = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.clear();
    nav("/");
  };

  const menuClass = (path) =>
    `p-3 rounded-lg text-left transition ${
      location.pathname === path
        ? "bg-blue-500 text-white"
        : "hover:bg-blue-100 text-gray-700"
    }`;

  return (
    <div className="h-full flex flex-col bg-white shadow-lg p-5 w-64">

      {/* Mobile Close */}
      {close && (
        <button
          onClick={close}
          className="md:hidden mb-4 text-gray-500"
        >
          ✖ Close
        </button>
      )}

      {/* Title */}
      <h1 className="text-xl font-bold text-blue-600 mb-6">
        Patient Panel
      </h1>

      {/* MENU */}
      <nav className="flex flex-col gap-2">

        {/* Book Token */}
        {/* <button
          onClick={() => nav("/patient/book")}
          className={menuClass("/patient/book")}
        >
          ➕ Book Token
        </button> */}

        {/* My Tokens */}
        <button
          onClick={() => nav("/my-tokens")}
          className={menuClass("/my-tokens")}
        >
          📄 My Tokens
        </button>

      </nav>

      {/* Logout */}
      <div className="mt-auto">
        <button
          onClick={logout}
          className="w-full bg-red-500 text-white p-3 rounded-lg hover:bg-red-600"
        >
          Logout
        </button>
      </div>

    </div>
  );
}