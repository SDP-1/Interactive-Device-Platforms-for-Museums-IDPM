import React from "react";
import { Link, useLocation } from "react-router-dom";
import Header from "./Header";

const Sidebar: React.FC<{
  collapsed: boolean;
  mobileOpen: boolean;
  onClose: () => void;
}> = ({ collapsed, mobileOpen, onClose }) => {
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
      to: "/tours",
      label: "Tours",
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
            d="M4 6h6v6H4zM14 6h6M14 12h6M4 18h16"
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
    <>
      <aside
        className={`bg-white/70 backdrop-blur-sm border-r hidden md:block fixed left-0 top-[72px] bottom-0 overflow-y-auto z-30 transition-all duration-200 ${collapsed ? "w-20" : "w-64"}`}
      >
        <div className="p-4 flex items-center justify-center">
          <div
            className={`flex items-center gap-3 ${collapsed ? "flex-col" : ""}`}
          >
            {!collapsed ? (
              <>
                <h2 className="text-lg font-semibold">Museum CMS</h2>
                <p className="text-sm text-slate-500">Admin</p>
              </>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-pink-500 shadow-md" />
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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-250 ${active ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-gray-50"}`}
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

      {/* Mobile Drawer */}
      <div
        className={`md:hidden ${mobileOpen ? "fixed inset-0 z-40" : "pointer-events-none"}`}
        aria-hidden={!mobileOpen}
      >
        <div
          className={`fixed inset-0 bg-black/40 transition-opacity ${mobileOpen ? "opacity-100" : "opacity-0"}`}
          onClick={onClose}
        />
        <div
          className={`fixed top-0 left-0 h-full w-64 bg-white p-4 shadow-soft transform transition-transform ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="p-2 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Museum CMS</h2>
              <p className="text-sm text-slate-500">Admin</p>
            </div>
          </div>
          <nav className="mt-4 px-2 py-3 space-y-1">
            {nav.map((n) => {
              const active = location.pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  title={n.label}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-250 ${active ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-gray-50"}`}
                  onClick={onClose}
                >
                  <div className="w-6 h-6 flex items-center justify-center text-gray-600">
                    {n.icon}
                  </div>
                  <span className="text-sm">{n.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    // close mobile drawer on navigation
    setMobileOpen(false);
  }, [location.pathname]);

  const handleToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileOpen((v) => !v);
    } else {
      setCollapsed((c) => !c);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7F2] w-full">
      <Header onToggle={handleToggle} collapsed={collapsed} />
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <main
        className={`pt-[72px] px-4 sm:px-6 lg:px-8 transition-[margin] duration-250 ease-in-expo ${collapsed ? "md:ml-20" : "md:ml-64"}`}
        style={{ willChange: "margin" }}
      >
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
