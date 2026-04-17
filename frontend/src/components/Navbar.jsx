export default function Navbar({ toggleSidebar }) {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="bg-white shadow px-4 py-3 flex justify-between items-center">

        <button
        onClick={toggleSidebar}
        className="md:hidden text-xl"
      >
        ☰
      </button>

      <h1 className="font-semibold text-gray-700">
        Dashboard
      </h1>

      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-600">
          {user?.name || "User"}
        </div>

        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
          {user?.name?.[0] || "U"}
        </div>
      </div>

    </div>
  );
}