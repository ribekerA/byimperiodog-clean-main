module.exports = {
  plugins: {
    // Inlina o @import de app/(admin)/admin/admin.css antes do Tailwind, para
    // o @config dele valer sobre o globals.css inteiro.
    "postcss-import": {},
    tailwindcss: {},
    autoprefixer: {},
  },
}
