/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ocean Paper Light Theme Tokens
        'paper-bg': '#F7F9FA',
        'paper-surface': '#FFFFFF',
        'paper-surface-alt': '#EEF3F5',
        'paper-border': '#D9E2E7',
        'paper-border-strong': '#BCCBD5',
        'paper-text': '#0F2A3A',
        'paper-text-muted': '#5B7280',
        'paper-primary': '#0F766E',
        'paper-primary-hover': '#0B5F58',
        'paper-primary-light': '#E6F4F2',
        'paper-secondary': '#0369A1',
        'paper-secondary-light': '#E0F2FE',
        'paper-accent-amber': '#D97706',
        'paper-accent-amber-light': '#FEF3C7',
        'paper-accent-coral': '#E4572E',
        'paper-accent-coral-light': '#FEE2E2',
        'paper-purple': '#7C3AED',
        'paper-purple-light': '#EDE9FE',
        'paper-slate': '#64748B',
        'paper-success': '#15803D',
        'paper-danger': '#B91C1C',

        // Ocean Light Theme Compatibility Aliases
        'marine-blue': '#F7F9FA',
        'marine-deep': '#EEF3F5',
        'marine-surface': '#FFFFFF',
        'marine-surface-elevated': '#FFFFFF',
        'marine-cyan': '#0F766E',
        'marine-cyan-bright': '#0369A1',
        'marine-cyan-dim': 'rgba(15, 118, 110, 0.08)',
        'marine-green': '#15803D',
        'marine-yellow': '#D97706',
        'marine-orange': '#E4572E',
        'marine-teal': '#0F766E',
        'marine-indigo': '#0369A1',
        'marine-dark': '#0F2A3A',
        'marine-border': '#D9E2E7',
        'marine-border-subtle': '#E5ECEF',
      },
      boxShadow: {
        'paper-sm': '0 1px 2px 0 rgba(15, 42, 58, 0.05)',
        'paper-card': '0 1px 2px rgba(15, 42, 58, 0.06), 0 8px 24px rgba(15, 42, 58, 0.06)',
        'paper-elevated': '0 4px 6px -1px rgba(15, 42, 58, 0.07), 0 12px 32px rgba(15, 42, 58, 0.09)',
        'ocean-glass': '0 1px 2px rgba(15, 42, 58, 0.06), 0 8px 24px rgba(15, 42, 58, 0.06)',
        'ocean-glow': '0 0 0 3px rgba(15, 118, 110, 0.18)',
        'ocean-glow-lg': '0 0 0 4px rgba(3, 105, 161, 0.22)',
        'ocean-card': '0 1px 2px rgba(15, 42, 58, 0.06), 0 8px 24px rgba(15, 42, 58, 0.06)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
