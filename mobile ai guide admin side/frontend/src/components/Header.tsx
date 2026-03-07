import React from "react";

type HeaderProps = {
  onToggle: () => void;
};

const Header: React.FC<HeaderProps> = ({ onToggle }) => {
  return (
    <header className="bg-[#071428] fixed top-0 left-0 right-0 z-40 w-full h-[72px]">
      <div className="w-full h-full px-3 sm:px-4 lg:px-6">
        <div className="flex h-full items-center gap-4">
          <button
            aria-label="Toggle sidebar"
            onClick={onToggle}
            className="p-2 rounded-md bg-white/6 hover:bg-white/10 text-cyan-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-pink-500 flex items-center justify-center shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-white"
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

            <div className="leading-tight">
              <h1 className="text-xl font-semibold text-white">
                Museum Mobile CMS
              </h1>
              <p className="text-xs text-cyan-200">Admin interface</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
