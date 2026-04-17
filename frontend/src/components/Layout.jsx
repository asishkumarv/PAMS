import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}
      <Sidebar />

      {/* Content */}
      <div className="flex-1 flex flex-col">

        <Navbar />

        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>

      </div>
    </div>
  );
}