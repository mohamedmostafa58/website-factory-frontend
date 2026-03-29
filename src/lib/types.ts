// ── Types matching the Payload CMS schema ──

export interface SiteBundle {
  site: Site
  settings: SiteSettings | null
  pages: Page[]
  fetchedAt: string
}

export interface Site {
  id: string
  name: string
  domain: string
  status: 'active' | 'maintenance' | 'disabled'
}

export interface SiteSettings {
  id: string
  site: string | Site
  theme: Theme
  headerLinks: NavLink[]
  footerLinks: FooterGroup[]
  footerContent: {
    copyrightText: string
    showPoweredBy: boolean
  }
  seo: {
    metaTitle?: string
    metaDescription?: string
    ogImage?: MediaItem
  }
}

export interface Theme {
  primaryColor: string
  secondaryColor: string
  accentColor?: string
  backgroundColor?: string
  textColor?: string
  fontFamily: string
  headingFontFamily: string
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  layoutTheme: 'modern' | 'classic' | 'bold' | 'minimal'
}

export interface NavLink {
  label: string
  url: string
  openInNewTab?: boolean
  children?: NavLink[]
}

export interface FooterGroup {
  groupLabel: string
  links: { label: string; url: string; openInNewTab?: boolean }[]
}

export interface Page {
  id: string
  site: string | Site
  title: string
  slug: string
  status: 'draft' | 'published'
  isHomePage?: boolean
  pageStyle?: {
    template: string
    overridePrimaryColor?: string
    overrideBackgroundColor?: string
    customCSS?: string
  }
  seo?: {
    metaTitle?: string
    metaDescription?: string
    ogImage?: MediaItem
  }
  blocks: Block[]
}

export interface MediaItem {
  id: string
  url: string
  alt: string
  width?: number
  height?: number
}

// ── Block Types ──
export type Block = HeroBlock | ContentBlock | ImageGalleryBlock | ContactFormBlock

export interface HeroBlock {
  blockType: 'hero'
  style: 'centered' | 'split' | 'fullscreen' | 'minimal'
  heading: string
  subheading?: string
  backgroundImage?: MediaItem
  cta?: { label?: string; url?: string; variant?: string }
  secondaryCta?: { label?: string; url?: string }
  overlayOpacity?: number
}

export interface ContentBlock {
  blockType: 'content'
  layout: 'default' | 'two-col' | 'narrow' | 'sidebar'
  columns: { richText: any; width: string }[]
  backgroundColor?: string
}

export interface ImageGalleryBlock {
  blockType: 'imageGallery'
  heading?: string
  layout: 'grid' | 'masonry' | 'carousel'
  columns: '2' | '3' | '4'
  images: { image: MediaItem; caption?: string; alt: string }[]
}

export interface ContactFormBlock {
  blockType: 'contactForm'
  heading?: string
  description?: string
  fields: {
    label: string
    fieldType: 'text' | 'email' | 'tel' | 'textarea' | 'select'
    required?: boolean
    options?: { label: string; value: string }[]
  }[]
  submitLabel?: string
  successMessage?: string
  recipientEmail?: string
}
