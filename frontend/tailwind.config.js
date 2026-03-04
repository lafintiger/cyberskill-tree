module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0a0e27',
          card: '#1a1f3a',
          accent: '#00f0ff',
          secondary: '#ff00ff',
          success: '#00ff41',
          warning: '#ffaa00',
        }
      },
      fontFamily: {
        mono: ['Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
