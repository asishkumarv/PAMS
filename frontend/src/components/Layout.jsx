import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-gray-100 overflow-hidden">

      {/* Sidebar (desktop) */}
      <div className="hidden md:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* Sidebar (mobile) */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-64 bg-white shadow-lg">
            <Sidebar close={() => setOpen(false)} />
          </div>

          <div
            className="flex-1 bg-black/40"
            onClick={() => setOpen(false)}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col w-full overflow-hidden">

        <Navbar toggleSidebar={() => setOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>

      </div>
    </div>
  );
}