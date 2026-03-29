/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // These map to CSS variables set dynamically from Payload CMS
        primary: 'var(--color-primary, #3B82F6)',
        'primary-light': 'var(--color-primary-light, #DBEAFE)',
        secondary: 'var(--color-secondary, #10B981)',
        'secondary-light': 'var(--color-secondary-light, #D1FAE5)',
        accent: 'var(--color-accent, #F59E0B)',
        surface: 'var(--color-background, #FFFFFF)',
        'on-surface': 'var(--color-text, #1F2937)',
      },
      fontFamily: {
        body: 'var(--font-body, "Inter", sans-serif)',
        heading: 'var(--font-heading, var(--font-body, "Inter", sans-serif))',
      },
      borderRadius: {
        theme: 'var(--border-radius, 8px)',
      },
    },
  },
  plugins: [],
}
