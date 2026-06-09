// ── Month data + Premium SVG icons ─────────────────────────────────────────────
export const MONTHS = [
  {
    num: 1, key: 'jan', name: { en: 'January', de: 'Januar', bs: 'Januar' },
    short: { en: 'JAN', de: 'JAN', bs: 'JAN' },
    season: 'winter',
    // Crystalline 6-arm snowflake with branches and center gem
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="2" x2="12" y2="22"/>
      <line x1="3" y1="7" x2="21" y2="17"/>
      <line x1="21" y1="7" x2="3" y2="17"/>
      <line x1="12" y1="6" x2="9.5" y2="8.5"/>
      <line x1="12" y1="6" x2="14.5" y2="8.5"/>
      <line x1="12" y1="18" x2="9.5" y2="15.5"/>
      <line x1="12" y1="18" x2="14.5" y2="15.5"/>
      <line x1="18.2" y1="8.5" x2="16" y2="8"/>
      <line x1="18.2" y1="8.5" x2="18.7" y2="10.7"/>
      <line x1="5.8" y1="15.5" x2="8" y2="16"/>
      <line x1="5.8" y1="15.5" x2="5.3" y2="13.3"/>
      <line x1="18.2" y1="15.5" x2="16" y2="16"/>
      <line x1="18.2" y1="15.5" x2="18.7" y2="13.3"/>
      <line x1="5.8" y1="8.5" x2="8" y2="8"/>
      <line x1="5.8" y1="8.5" x2="5.3" y2="10.7"/>
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>
    </svg>`
  },
  {
    num: 2, key: 'feb', name: { en: 'February', de: 'Februar', bs: 'Februar' },
    short: { en: 'FEB', de: 'FEB', bs: 'FEB' },
    season: 'winter',
    // Heart — filled with glow + center gem + arrow
    icon: `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path fill="currentColor" fill-opacity="0.2" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      <line x1="4" y1="16" x2="9" y2="11" stroke-width="1.2"/>
      <polyline points="7 11 9 11 9 13" stroke-width="1.2"/>
      <circle cx="12" cy="12.5" r="1.3" fill="currentColor" stroke="none"/>
    </svg>`
  },
  {
    num: 3, key: 'mar', name: { en: 'March', de: 'März', bs: 'Mart' },
    short: { en: 'MAR', de: 'MRZ', bs: 'MAR' },
    season: 'spring',
    // Cherry blossom — 5 petals via rotated ellipses + golden center
    icon: `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
      <ellipse cx="12" cy="6.2" rx="2.1" ry="3.5" fill="currentColor" fill-opacity="0.18"/>
      <ellipse cx="12" cy="6.2" rx="2.1" ry="3.5" fill="currentColor" fill-opacity="0.18" transform="rotate(72 12 12)"/>
      <ellipse cx="12" cy="6.2" rx="2.1" ry="3.5" fill="currentColor" fill-opacity="0.18" transform="rotate(144 12 12)"/>
      <ellipse cx="12" cy="6.2" rx="2.1" ry="3.5" fill="currentColor" fill-opacity="0.18" transform="rotate(216 12 12)"/>
      <ellipse cx="12" cy="6.2" rx="2.1" ry="3.5" fill="currentColor" fill-opacity="0.18" transform="rotate(288 12 12)"/>
      <circle cx="12" cy="12" r="2.4" fill="currentColor" fill-opacity="0.9" stroke="none"/>
      <circle cx="12" cy="9.5" r="0.7" fill="currentColor" fill-opacity="0.6" stroke="none"/>
      <circle cx="14.1" cy="10.9" r="0.7" fill="currentColor" fill-opacity="0.6" stroke="none"/>
      <circle cx="9.9" cy="10.9" r="0.7" fill="currentColor" fill-opacity="0.6" stroke="none"/>
    </svg>`
  },
  {
    num: 4, key: 'apr', name: { en: 'April', de: 'April', bs: 'April' },
    short: { en: 'APR', de: 'APR', bs: 'APR' },
    season: 'spring',
    // Thunderstorm cloud with rain drops
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path fill="currentColor" fill-opacity="0.12" d="M20 15.5A4.5 4.5 0 0 0 17.5 7H16A7 7 0 1 0 5 14.5"/>
      <path d="M20 15.5A4.5 4.5 0 0 0 17.5 7H16A7 7 0 1 0 5 14.5"/>
      <line x1="8" y1="19" x2="7" y2="21"/>
      <line x1="12" y1="18" x2="11" y2="20"/>
      <line x1="16" y1="19" x2="15" y2="21"/>
      <circle cx="8" cy="18" r="0.7" fill="currentColor" stroke="none"/>
      <circle cx="12" cy="17" r="0.7" fill="currentColor" stroke="none"/>
      <circle cx="16" cy="18" r="0.7" fill="currentColor" stroke="none"/>
    </svg>`
  },
  {
    num: 5, key: 'maj', name: { en: 'May', de: 'Mai', bs: 'Maj' },
    short: { en: 'MAY', de: 'MAI', bs: 'MAJ' },
    season: 'spring',
    // Radiant sun — filled circle + 8 alternating rays
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="4.5" fill="currentColor" fill-opacity="0.18"/>
      <line x1="12" y1="1.5" x2="12" y2="4.2"/>
      <line x1="12" y1="19.8" x2="12" y2="22.5"/>
      <line x1="1.5" y1="12" x2="4.2" y2="12"/>
      <line x1="19.8" y1="12" x2="22.5" y2="12"/>
      <line x1="4.52" y1="4.52" x2="6.42" y2="6.42"/>
      <line x1="17.58" y1="17.58" x2="19.48" y2="19.48"/>
      <line x1="19.48" y1="4.52" x2="17.58" y2="6.42"/>
      <line x1="6.42" y1="17.58" x2="4.52" y2="19.48"/>
    </svg>`
  },
  {
    num: 6, key: 'jun', name: { en: 'June', de: 'Juni', bs: 'Juni' },
    short: { en: 'JUN', de: 'JUN', bs: 'JUN' },
    season: 'summer',
    // Ocean waves — 3 sinuous wave lines
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 6.5c1.5-2 3-2.5 4.5-2.5 3 0 3 4 6 4 1.5 0 3-.8 4.5-2.5"/>
      <path d="M2 11.5c1.5-2 3-2.5 4.5-2.5 3 0 3 4 6 4 1.5 0 3-.8 4.5-2.5"/>
      <path d="M2 16.5c1.5-2 3-2.5 4.5-2.5 3 0 3 4 6 4 1.5 0 3-.8 4.5-2.5"/>
    </svg>`
  },
  {
    num: 7, key: 'jul', name: { en: 'July', de: 'Juli', bs: 'Juli' },
    short: { en: 'JUL', de: 'JUL', bs: 'JUL' },
    season: 'summer',
    // Lightning bolt — bold filled bolt with glow
    icon: `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <polygon fill="currentColor" fill-opacity="0.22" points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>`
  },
  {
    num: 8, key: 'avg', name: { en: 'August', de: 'August', bs: 'Avgust' },
    short: { en: 'AUG', de: 'AUG', bs: 'AVG' },
    season: 'summer',
    // North Star / compass rose — 4-point star with inner 4-point
    icon: `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
      <path fill="currentColor" fill-opacity="0.2" d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z"/>
      <path fill="currentColor" fill-opacity="0.15" d="M12 6.5 L13.3 10.7 L17.5 12 L13.3 13.3 L12 17.5 L10.7 13.3 L6.5 12 L10.7 10.7 Z" stroke="none"/>
      <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/>
    </svg>`
  },
  {
    num: 9, key: 'sep', name: { en: 'September', de: 'September', bs: 'Septembar' },
    short: { en: 'SEP', de: 'SEP', bs: 'SEP' },
    season: 'autumn',
    // Maple leaf — 5-lobe shape with stem and veins
    icon: `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path fill="currentColor" fill-opacity="0.18" d="M12 2 C11 4 8 4 7 6 C5 6 3 7.5 4 9.5 C5 9 6 9 7 9.5 C6 11 5.5 12 6.5 14 C8 13 9 12.5 11 13 C10 14 10 15.5 12 17 C14 15.5 14 14 13 13 C15 12.5 16 13 17.5 14 C18.5 12 18 11 17 9.5 C18 9 19 9 20 9.5 C21 7.5 19 6 17 6 C16 4 13 4 12 2Z"/>
      <line x1="12" y1="17" x2="12" y2="22"/>
      <line x1="12" y1="10" x2="9" y2="7" stroke-width="1"/>
      <line x1="12" y1="10" x2="15" y2="7" stroke-width="1"/>
      <line x1="12" y1="13" x2="9" y2="11" stroke-width="0.9"/>
      <line x1="12" y1="13" x2="15" y2="11" stroke-width="0.9"/>
    </svg>`
  },
  {
    num: 10, key: 'okt', name: { en: 'October', de: 'Oktober', bs: 'Oktobar' },
    short: { en: 'OCT', de: 'OKT', bs: 'OKT' },
    season: 'autumn',
    // Crescent moon with sparkle stars
    icon: `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path fill="currentColor" fill-opacity="0.18" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      <line x1="19" y1="3.5" x2="19" y2="5.5"/>
      <line x1="18" y1="4.5" x2="20" y2="4.5"/>
      <line x1="22" y1="7" x2="22" y2="8.5"/>
      <line x1="21.25" y1="7.75" x2="22.75" y2="7.75"/>
      <circle cx="20.5" cy="11" r="0.7" fill="currentColor" stroke="none"/>
    </svg>`
  },
  {
    num: 11, key: 'nov', name: { en: 'November', de: 'November', bs: 'Novembar' },
    short: { en: 'NOV', de: 'NOV', bs: 'NOV' },
    season: 'autumn',
    // Wind — 3 sweeping arcs with rounded tips
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 8h11a3 3 0 1 0-3-3"/>
      <path d="M3 12h15a3 3 0 1 1-3 3"/>
      <path d="M3 16h8a2 2 0 1 0-2-2"/>
    </svg>`
  },
  {
    num: 12, key: 'dec', name: { en: 'December', de: 'Dezember', bs: 'Decembar' },
    short: { en: 'DEC', de: 'DEZ', bs: 'DEC' },
    season: 'winter',
    // Christmas pine tree with ornament dots and star
    icon: `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path fill="currentColor" fill-opacity="0.18" d="M12 2 L5.5 10 H9 L4 18 H10 V22 H14 V18 H20 L15 10 H18.5 Z"/>
      <line x1="10" y1="22" x2="14" y2="22"/>
      <circle cx="9" cy="8" r="0.8" fill="currentColor" stroke="none"/>
      <circle cx="15" cy="12" r="0.8" fill="currentColor" stroke="none"/>
      <circle cx="10" cy="14" r="0.8" fill="currentColor" stroke="none"/>
      <circle cx="14" cy="16" r="0.8" fill="currentColor" stroke="none"/>
      <circle cx="12" cy="2.5" r="1.2" fill="currentColor" stroke="none"/>
    </svg>`
  }
]
