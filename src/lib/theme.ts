/**
 * Theme utilities — maps Payload CMS design tokens to CSS variables
 */

import type { Theme } from './types'

const FONT_MAP: Record<string, string> = {
  inter: '"Inter", sans-serif',
  roboto: '"Roboto", sans-serif',
  poppins: '"Poppins", sans-serif',
  playfair: '"Playfair Display", serif',
  montserrat: '"Montserrat", sans-serif',
  'dm-sans': '"DM Sans", sans-serif',
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  inherit: 'inherit',
}

const RADIUS_MAP: Record<string, string> = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
}

const GOOGLE_FONT_MAP: Record<string, string> = {
  inter: 'Inter:wght@400;500;600;700',
  roboto: 'Roboto:wght@400;500;700',
  poppins: 'Poppins:wght@400;500;600;700',
  playfair: 'Playfair+Display:wght@400;600;700',
  montserrat: 'Montserrat:wght@400;500;600;700',
  'dm-sans': 'DM+Sans:wght@400;500;700',
}

/**
 * Convert a hex color to a lighter variant (for backgrounds).
 */
function lightenHex(hex: string, amount = 0.85): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.round((num >> 16) + (255 - (num >> 16)) * amount)
  const g = Math.round(((num >> 8) & 0x00ff) + (255 - ((num >> 8) & 0x00ff)) * amount)
  const b = Math.round((num & 0x0000ff) + (255 - (num & 0x0000ff)) * amount)
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`
}

/**
 * Generate CSS custom properties from Payload theme object.
 */
export function themeToCSSVars(theme: Theme | undefined | null): string {
  if (!theme) return ''

  const vars: string[] = [
    `--color-primary: ${theme.primaryColor}`,
    `--color-primary-light: ${lightenHex(theme.primaryColor)}`,
    `--color-secondary: ${theme.secondaryColor}`,
    `--color-secondary-light: ${lightenHex(theme.secondaryColor)}`,
    `--color-accent: ${theme.accentColor ?? '#F59E0B'}`,
    `--color-background: ${theme.backgroundColor ?? '#FFFFFF'}`,
    `--color-text: ${theme.textColor ?? '#1F2937'}`,
    `--font-body: ${FONT_MAP[theme.fontFamily] ?? FONT_MAP.system}`,
    `--font-heading: ${theme.headingFontFamily === 'inherit' ? 'var(--font-body)' : (FONT_MAP[theme.headingFontFamily] ?? 'var(--font-body)')}`,
    `--border-radius: ${RADIUS_MAP[theme.borderRadius] ?? RADIUS_MAP.md}`,
  ]

  return vars.join(';\n    ')
}

/**
 * Generate Google Fonts <link> tag for the selected fonts.
 */
export function getGoogleFontsUrl(theme: Theme | undefined | null): string | null {
  if (!theme) return null

  const families: string[] = []

  if (theme.fontFamily && GOOGLE_FONT_MAP[theme.fontFamily]) {
    families.push(GOOGLE_FONT_MAP[theme.fontFamily])
  }
  if (
    theme.headingFontFamily &&
    theme.headingFontFamily !== 'inherit' &&
    theme.headingFontFamily !== theme.fontFamily &&
    GOOGLE_FONT_MAP[theme.headingFontFamily]
  ) {
    families.push(GOOGLE_FONT_MAP[theme.headingFontFamily])
  }

  if (families.length === 0) return null

  return `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join('&')}&display=swap`
}

/**
 * Get layout theme class names.
 */
export function getLayoutThemeClasses(layoutTheme: string | undefined): string {
  switch (layoutTheme) {
    case 'classic':
      return 'theme-classic'
    case 'bold':
      return 'theme-bold'
    case 'minimal':
      return 'theme-minimal'
    case 'modern':
    default:
      return 'theme-modern'
  }
}
