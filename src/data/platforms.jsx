export const PLATFORM_COLORS = {
  youtube:   '#FF0000',
  linkedin:  '#0077B5',
  instagram: '#E1306C',
  tiktok:    '#fe2c55',
}

// White icons — always on colored background, works on both dark + light theme
export const PLATFORM_ICONS = {
  youtube: (size = 16) => (
    <svg viewBox="0 0 24 24" fill="white" style={{ width: size, height: size }}>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#FF0000"/>
    </svg>
  ),
  linkedin: (size = 16) => (
    <svg viewBox="0 0 24 24" fill="white" style={{ width: size, height: size }}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect x="2" y="9" width="4" height="12"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  ),
  instagram: (size = 16) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: size, height: size }}>
      <rect x="2" y="2" width="20" height="20" rx="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="white" stroke="none"/>
    </svg>
  ),
  tiktok: (size = 16) => (
    <svg viewBox="0 0 24 24" fill="white" style={{ width: size, height: size }}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.84 1.55V6.79a4.85 4.85 0 0 1-1.07-.1z"/>
    </svg>
  ),
}

// Colored square container with white icon inside — theme-safe
export function PlatformIcon({ platform, size = 32 }) {
  const color = PLATFORM_COLORS[platform] || '#666'
  const icon = PLATFORM_ICONS[platform]
  const iconSize = Math.round(size * 0.55)
  return (
    <div style={{
      width: size, height: size,
      borderRadius: Math.round(size * 0.28),
      background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {icon?.(iconSize)}
    </div>
  )
}
