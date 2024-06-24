/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background': '#0D1B2A',
        'blues': '#170072',
        'secondary': '#1B263B',
        'third': '#415A77',
        'txt': '#E0E1DD',
        'grays': '#A0A0A0',
        'reds': '#E00000', 
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      fontWeight: {
        thin: 100,
        extralight: 200,
        light: 300,
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
        black: 900,
      },
      fontStyle: {
        italic: 'italic',
        normal: 'normal',
      },
    },
  },
  plugins: [],
}

