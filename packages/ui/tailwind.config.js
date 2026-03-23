/** @type {import('tailwindcss').Config} */

function withOpacity(variable) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `color-mix(in srgb, var(${variable}) ${opacityValue * 100}%, transparent)`;
    }
    return `var(${variable})`;
  };
}

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: withOpacity('--bg-primary'),
        secondary: withOpacity('--bg-secondary'),
        card: withOpacity('--bg-card'),
        'text-primary': withOpacity('--text-primary'),
        'text-secondary': withOpacity('--text-secondary'),
        accent: {
          DEFAULT: withOpacity('--accent'),
          hover: withOpacity('--accent-hover'),
          light: withOpacity('--accent-light'),
        },
        success: withOpacity('--success'),
        warning: withOpacity('--warning'),
        danger: withOpacity('--danger'),
        border: withOpacity('--border'),
      },
      borderRadius: {
        soft: '12px',
        card: '16px',
      },
      boxShadow: {
        soft: 'var(--shadow)',
        'soft-lg': 'var(--shadow-lg)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
