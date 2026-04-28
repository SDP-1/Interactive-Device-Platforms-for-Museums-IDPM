import React from "react";

type HeaderProps = {
  onToggle: () => void;
  collapsed: boolean;
};

const Header: React.FC<HeaderProps> = ({ onToggle, collapsed }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[72px] w-full bg-[#071428]/95 backdrop-blur-sm shadow-soft">
      <button
        aria-label="Toggle sidebar"
        aria-expanded={!collapsed}
        onClick={onToggle}
        className={`absolute left-4 top-1/2 -translate-y-1/2 z-50 btn p-2 rounded-lg bg-transparent hover:bg-slate-700/20 text-cyan-100 focus:outline-none focus:ring-2 focus:ring-blue-200`}
      >
        <span className={`hamburger`} aria-hidden>
          <span className="hamburger-bar hamburger-bar--top" />
          <span className="hamburger-bar hamburger-bar--middle" />
          <span className="hamburger-bar hamburger-bar--bottom" />
        </span>
        <span className="sr-only">Toggle navigation</span>
      </button>

      <div className="max-w-7xl mx-auto w-full h-full pl-4 sm:pl-6 px-4 sm:px-6 lg:px-8">
        <div className="flex h-full items-center gap-4">
          {/* Branding placed near hamburger on the left */}
          <div className="absolute left-14 sm:left-20 top-1/2 -translate-y-1/2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-pink-500 flex items-center justify-center shadow-md ring-1 ring-white/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 11.5L12 4l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-8.5z"
                />
              </svg>
            </div>

            <div className="leading-tight hidden sm:block">
              <h1 className="text-lg sm:text-xl font-semibold text-white">
                Museum Mobile CMS
              </h1>
              <p className="text-sm text-cyan-200">Admin interface</p>
            </div>
          </div>

          <div className="ml-auto" />
        </div>
      </div>
    </header>
  );
};

export default Header;
