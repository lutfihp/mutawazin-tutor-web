/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          light: '#DBEAFE',
        },
        teal: {
          DEFAULT: '#0D9488',
          dark: '#0b7a70',
          light: '#CCFBF1',
        },
        muted: '#64748B',
        border: '#E2E8F0',
        bgGray: '#F8FAFC',
        text: '#0F172A',
        text2: '#64748B',
        text3: '#CBD5E1',
        success: '#10B981',
        successBg: '#DCFCE7',
        successText: '#15803D',
        warning: '#F59E0B',
        warningBg: '#FEF9C3',
        warningText: '#854D0E',
        error: '#EF4444',
        errorBg: '#FEE2E2',
        errorText: '#991B1B',
        violet: {
          bg: '#F3E8FF',
          text: '#7E22CE',
        },
        gold: {
          bg: '#FEF3C7',
          text: '#92400E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '12px',
        lg: '16px',
        pill: '9999px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(15,23,42,.08)',
        md: '0 4px 14px rgba(15,23,42,.08)',
        lg: '0 20px 50px -20px rgba(15,23,42,.25)',
        modal: '0 24px 60px -20px rgba(15,23,42,.45)',
        'btn-primary': '0 6px 16px -6px rgba(37,99,235,.55)',
      },
      maxWidth: {
        auth: '480px',
        profile: '880px',
        content: '1200px',
        app: '1280px',
      },
      screens: {
        'nav-collapse': '900px',
        'sidebar-collapse': '960px',
        'calendar-panel': '1100px',
      },
    },
  },
  plugins: [],
};
