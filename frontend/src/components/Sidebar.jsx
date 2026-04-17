import { useNavigate } from "react-router-dom";

export default function Sidebar() {
  const nav = useNavigate();

  const logout = () => {
    localStorage.clear();
    nav("/");
  };

  return (
    <div className="hidden lg:flex flex-col w-64 bg-white shadow-lg p-4">

      <h1 className="text-xl font-bold mb-6 text-blue-600">
        PAMS
      </h1>

      <nav className="flex flex-col gap-3">

        <button
          onClick={() => nav("/dashboard")}
          className="text-left p-3 rounded-lg hover:bg-blue-100"
        >
          Dashboard
        </button>
        <button onClick={() => nav("/book-token")}>
  Book Token
</button>
        <button onClick={() => nav("/set-appointment")}>
  Set Appointment
</button>

        <button className="text-left p-3 rounded-lg hover:bg-blue-100">
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