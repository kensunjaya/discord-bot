/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background': '#EEF5FF',
        'blues': '#170072',
        'bluesa': '#D2DAFF',
        'bluesk': '#4663AC',
        'bluesi': '#FFFFFF',
        'darkblue': '#170072',
        'lgtblue': '#0070E0',
        'lgtbluebg': '#D3E4F4',
        'darkbluebg': '#C5D7EB',
        'greenapr': '#009F5C',
        'grays': '#A0A0A0',
        'reds': '#E00000', 
      }
    },
  },
  plugins: [],
}

