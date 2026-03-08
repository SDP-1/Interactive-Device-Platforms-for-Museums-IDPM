import React from "react";
import { Link, useLocation } from "react-router-dom";
import Header from "./Header";

const Sidebar: React.FC<{ collapsed: boolean }> = ({ collapsed }) => {
  const location = useLocation();
  const nav = [
    {
      to: "/",
      label: "Dashboard",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h4V3h10v7h4v11H3V10z"
          />
        </svg>
      ),
    },
    {
      to: "/artifacts",
      label: "Artifacts",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2"
          />
        </svg>
      ),
    },
    {
      to: "/kings",
      label: "Kings",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v13"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 7l4 4 4-4 4 4 4-4"
          />
        </svg>
      ),
    },
    {
      to: "/featured-exhibits",
      label: "Featured Exhibits",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 6v12"
          />
        </svg>
      ),
    },
    {
      to: "/sessions",
      label: "Sessions",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7v10l6-5-6-5z"
          />
        </svg>
      ),
    },
    {
      to: "/feedback",
      label: "Feedback",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h8M8 14h5m8 2a2 2 0 01-2 2H7l-4 3V5a2 2 0 012-2h14a2 2 0 012 2v11z"
          />
        </svg>
      ),
    },
  ];

  return (
    <aside
      className={`bg-white border-r hidden md:block fixed left-0 top-[72px] bottom-0 overflow-y-auto z-30 transition-all duration-200 ${collapsed ? "w-20" : "w-64"}`}
    >
      <div className="p-4 flex items-center justify-center">
        <div
          className={`flex items-center gap-3 ${collapsed ? "flex-col" : ""}`}
        >
          {!collapsed ? (
            <>
              <h2 className="text-lg font-bold">Museum CMS</h2>
              <p className="text-xs text-gray-500">Admin</p>
            </>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-pink-500" />
          )}
        </div>
      </div>
      <nav className="px-2 py-3 space-y-1">
        {nav.map((n) => {
          const active = location.pathname === n.to;
          return (
            <Link
              key={n.to}
              to={n.to}
              title={n.label}
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${active ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
            >
              <div className="w-6 h-6 flex items-center justify-center text-gray-600">
                {n.icon}
              </div>
              {!collapsed && <span className="text-sm">{n.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#FBF7F2] w-full">
      <Header onToggle={() => setCollapsed((c) => !c)} />
      <Sidebar collapsed={collapsed} />
      <main className={`pt-[72px] px-0 ${collapsed ? "md:ml-20" : "md:ml-64"}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
