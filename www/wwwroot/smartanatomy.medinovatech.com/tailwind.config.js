/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sky: {
          500: '#0ea5e9',
        },
        emerald: {
          500: '#10b981',
        },
        amber: {
          500: '#f59e0b',
        },
        purple: {
          500: '#a855f7',
        },
      },
    },
  },
  plugins: [],
};
