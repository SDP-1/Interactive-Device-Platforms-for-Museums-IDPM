import defaultTheme from "tailwindcss/defaultTheme";
import colors from "tailwindcss/colors";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        xl: "1rem",
      },
      boxShadow: {
        soft: "0 6px 18px rgba(15,23,42,0.08)",
        "soft-md": "0 8px 30px rgba(2,6,23,0.06)",
      },
      transitionTimingFunction: {
        "in-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        250: "250ms",
        350: "350ms",
      },
      colors: {
        primary: colors.blue,
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
