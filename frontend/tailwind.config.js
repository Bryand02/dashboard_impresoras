export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        panel: "#050608",
        shell: "#0c0f14",
        card: "#171c24",
        line: "#2a313b",
        accent: "#d7dde7",
        warm: "#ffb84d",
        danger: "#ff6b6b",
        success: "#43d17a"
      },
      fontFamily: {
        display: ["Rajdhani", "sans-serif"],
        body: ["Inter", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(215,221,231,0.08), 0 16px 44px rgba(0,0,0,0.38)"
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(120,129,143,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(120,129,143,0.08) 1px, transparent 1px)"
      },
      keyframes: {
        pulseLine: {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "1" }
        },
        rise: {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" }
        }
      },
      animation: {
        pulseLine: "pulseLine 2.6s ease-in-out infinite",
        rise: "rise 500ms ease-out"
      }
    }
  },
  plugins: []
};
