import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar: React.FC = () => {
  const location = useLocation();
  const nav = [
    { to: "/", label: "Dashboard" },
    { to: "/artifacts", label: "Artifacts" },
    { to: "/kings", label: "Kings" },
    { to: "/sessions", label: "Sessions" },
  ];

  return (
    <aside className="w-64 bg-white border-r hidden md:block">
      <div className="p-6">
        <h2 className="text-xl font-bold">Museum CMS</h2>
        <p className="text-sm text-gray-500">Admin</p>
      </div>
      <nav className="px-4 py-2 space-y-1">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className={`block px-3 py-2 rounded-md ${location.pathname === n.to ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <header className="bg-white shadow sticky top-0 z-20 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 rounded bg-gray-100">☰</button>
            <div>
              <h1 className="text-lg font-semibold">Museum CMS</h1>
              <p className="text-xs text-gray-500">Admin dashboard</p>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full px-4 sm:px-6 lg:px-8 flex gap-6">
        <Sidebar />
        <main className="flex-1 py-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
