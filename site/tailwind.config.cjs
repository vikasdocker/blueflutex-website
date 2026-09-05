/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#080C18",
        bg2: "#0A0F20",
        bg3: "#0D1228",
        c: "#00D4FF",
        c2: "#2563EB",
        c3: "#0EA5E9",
        txt: "#E8F0FF",
        txt2: "#8899BB",
        txt3: "#4A5878",
        bdr: "rgba(255,255,255,0.07)",
        bdr2: "rgba(0,212,255,0.18)",
      }
    }
  },
  plugins: [],
}