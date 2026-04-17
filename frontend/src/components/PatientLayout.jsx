import { useState } from "react";
import PatientSidebar from "./PatientSidebar";
import Navbar from "./Navbar";

export default function PatientLayout({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <PatientSidebar />
      </div>

      {/* Mobile Sidebar */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-64 bg-white shadow-lg">
            <PatientSidebar close={() => setOpen(false)} />
          </div>
          <div
            className="flex-1 bg-black/40"
            onClick={() => setOpen(false)}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col">

        <Navbar toggleSidebar={() => setOpen(true)} />

        <main className="p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>

      </div>
    </div>
  );
}