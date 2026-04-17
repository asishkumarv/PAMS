export default function Navbar() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="bg-white shadow px-6 py-4 flex justify-between items-center">

      <h2 className="text-lg font-semibold">
        Dashboard
      </h2>

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