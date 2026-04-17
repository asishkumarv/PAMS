import { useNavigate } from "react-router-dom";

export default function PatientSidebar({ close }) {
  const nav = useNavigate();

  const logout = () => {
    localStorage.clear();
    nav("/");
  };

  return (
    <div className="h-full flex flex-col bg-white shadow-lg p-5 w-64">

      {close && (
        <button
          onClick={close}
          className="md:hidden mb-4 text-gray-500"
        >
          ✖ Close
        </button>
      )}

      <h1 className="text-xl font-bold text-blue-600 mb-6">
        Patient Panel
      </h1>

      <nav className="flex flex-col gap-2">

        <button
          onClick={() => nav("/patient/book")}
          className="p-3 rounded-lg hover:bg-blue-100"
        >
          Book Token
        </button>

        <button
          onClick={() => nav("/patient/tokens")}
          className="p-3 rounded-lg hover:bg-blue-100"
        >
          My Tokens
        </button>

      </nav>

      <div className="mt-auto">
        <button
          onClick={logout}
          className="w-full bg-red-500 text-white p-3 rounded-lg"
        >
          Logout
        </button>
      </div>

    </div>
  );
}