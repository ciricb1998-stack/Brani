// ── Premium PDF Export ────────────────────────────────────────────────────────
import { jsPDF } from 'jspdf'
import { BRANDS } from '../data/brands.js'
import { MONTHS } from '../data/months.js'

const COLORS = {
  dark: [6, 8, 12],
  darkCard: [12, 16, 24],
  blue: [59, 130, 246],
  blueDim: [37, 99, 235],
  purple: [168, 85, 247],
  white: [255, 255, 255],
  muted: [120, 130, 150],
  light: [220, 230, 245],
  success: [34, 197, 94],
  border: [30, 40, 60]
}

function getBrandColor(brandId) {
  const map = {
    branip: COLORS.blue,
    brani: COLORS.blue,
    log: COLORS.purple
  }
  return map[brandId] || COLORS.blue
}

function hexLine(doc, y) {
  doc.setDrawColor(30, 40, 60)
  doc.setLineWidth(0.3)
  doc.line(14, y, 196, y)
}

function header(doc, brand, title, subtitle) {
  const b = BRANDS[brand]
  const col = getBrandColor(brand)

  // Dark background
  doc.setFillColor(...COLORS.dark)
  doc.rect(0, 0, 210, 297, 'F')

  // Top accent bar
  doc.setFillColor(...col)
  doc.rect(0, 0, 210, 2, 'F')

  // Brand block
  doc.setFillColor(...COLORS.darkCard)
  doc.roundedRect(14, 8, 182, 28, 2, 2, 'F')

  // Brand name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...col)
  doc.text(b.fullName.toUpperCase(), 20, 20)

  // Tagline
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...COLORS.muted)
  doc.text(b.tagline, 20, 27)

  // Date badge (top right)
  const now = new Date()
  const dateStr = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.muted)
  doc.text(dateStr, 196, 16, { align: 'right' })

  // Page title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...COLORS.white)
  doc.text(title, 14, 52)

  // Subtitle
  if (subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.muted)
    doc.text(subtitle, 14, 60)
  }

  hexLine(doc, 65)
  return 72 // starting Y for content
}

function footer(doc, pageNum) {
  doc.setFillColor(...COLORS.darkCard)
  doc.rect(0, 284, 210, 13, 'F')
  doc.setFillColor(...COLORS.blue)
  doc.rect(0, 295, 210, 2, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...COLORS.muted)
  doc.text('BRANI SYSTEM — Premium Export', 14, 291)
  doc.text(`Page ${pageNum}`, 196, 291, { align: 'right' })
}

function sectionCard(doc, y, title, content, color = COLORS.blue) {
  doc.setFillColor(...COLORS.darkCard)
  doc.roundedRect(14, y, 182, 8 + content.length * 7, 2, 2, 'F')
  doc.setFillColor(...color)
  doc.rect(14, y, 2, 8 + content.length * 7, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...color)
  doc.text(title.toUpperCase(), 20, y + 6)

  let cy = y + 14
  for (const [label, value] of content) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.muted)
    doc.text(label, 20, cy)
    doc.setTextColor(...COLORS.light)
    doc.text(String(value || '—'), 80, cy)
    cy += 7
  }
  return y + 12 + content.length * 7
}

// ── Export: Daily Report ───────────────────────────────────────────────────────
export function exportDailyPDF(data, date, brandId = 'brani') {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const d = date instanceof Date ? date : new Date(date)
  const dateStr = d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  const month = MONTHS[d.getMonth()]

  let y = header(doc, brandId, 'DAILY REPORT', dateStr)

  // Metrics row
  const metrics = [
    ['Feeling', data.feeling || '—'],
    ['Energy', data.energy || '—'],
    ['Sleep', data.sleep ? data.sleep + 'h' : '—'],
  ]
  for (let i = 0; i < metrics.length; i++) {
    const x = 14 + i * 62
    doc.setFillColor(...COLORS.darkCard)
    doc.roundedRect(x, y, 58, 18, 2, 2, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.muted)
    doc.text(metrics[i][0].toUpperCase(), x + 4, y + 7)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...getBrandColor(brandId))
    doc.text(String(metrics[i][1]), x + 4, y + 15)
  }
  y += 24

  // Morning rituals
  const rituals = [
    ['Morning Routine', data.morningRoutine ? '✓ Done' : '✗ Skipped'],
    ['Workout', data.workout ? '✓ Done' : '✗ Skipped'],
    ['Meditation', data.meditation ? '✓ Done' : '✗ Skipped'],
  ]
  y = sectionCard(doc, y + 2, 'Morning Rituals', rituals, getBrandColor(brandId))

  // Tasks
  const tasks = [
    ['Task 1', `${data.task1Done ? '✓' : '○'} ${data.task1 || '—'}`],
    ['Task 2', `${data.task2Done ? '✓' : '○'} ${data.task2 || '—'}`],
    ['Task 3', `${data.task3Done ? '✓' : '○'} ${data.task3 || '—'}`],
  ]
  y = sectionCard(doc, y + 4, 'Priority Tasks', tasks, getBrandColor(brandId))

  // Reflections
  const reflections = [
    ['Wins', data.wins || '—'],
    ['Challenges', data.challenges || '—'],
    ['Gratitude', data.gratitude || '—'],
    ['Notes', data.notes || '—'],
  ]
  y = sectionCard(doc, y + 4, 'Daily Reflection', reflections, getBrandColor(brandId))

  footer(doc, 1)
  doc.save(`BRANI_Daily_${d.toISOString().split('T')[0]}.pdf`)
}

// ── Export: Monthly Calendar ───────────────────────────────────────────────────
export function exportMonthlyPDF(year, month, daysData, brandId = 'brani') {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' })
  const monthData = MONTHS[month - 1]
  const title = `${monthData.name.de.toUpperCase()} ${year}`

  // Header (landscape)
  doc.setFillColor(...COLORS.dark)
  doc.rect(0, 0, 297, 210, 'F')

  const col = getBrandColor(brandId)
  doc.setFillColor(...col)
  doc.rect(0, 0, 297, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(...col)
  doc.text(title, 14, 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.muted)
  doc.text(BRANDS[brandId].tagline, 14, 28)

  // Calendar grid
  const days = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO']
  const colW = 38
  const rowH = 26
  const startX = 14
  const startY = 38

  days.forEach((d, i) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...col)
    doc.text(d, startX + i * colW + colW/2, startY, { align: 'center' })
  })

  hexLine(doc, startY + 4)

  // Days in month
  const firstDay = new Date(year, month - 1, 1).getDay()
  const offset = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(year, month, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const slot = day + offset - 1
    const col2 = slot % 7
    const row = Math.floor(slot / 7)
    const x = startX + col2 * colW
    const y = startY + 8 + row * rowH

    const dayKey = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    const hasData = daysData[dayKey]
    const isDone = hasData && (hasData.task1Done || hasData.task2Done || hasData.task3Done)

    doc.setFillColor(...(isDone ? col : COLORS.darkCard))
    doc.roundedRect(x + 1, y + 1, colW - 2, rowH - 2, 1, 1, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...(isDone ? COLORS.white : COLORS.light))
    doc.text(String(day), x + colW/2, y + 11, { align: 'center' })

    if (hasData) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.setTextColor(...(isDone ? [200, 220, 255] : COLORS.muted))
      const score = [hasData.task1Done, hasData.task2Done, hasData.task3Done].filter(Boolean).length
      doc.text(`${score}/3 tasks`, x + colW/2, y + 18, { align: 'center' })
    }
  }

  footer(doc, 1)
  doc.save(`BRANI_Calendar_${year}-${String(month).padStart(2,'0')}.pdf`)
}

// ── Export: Weekly Report ──────────────────────────────────────────────────────
export function exportWeeklyPDF(weekData, startDate, brandId = 'brani') {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const d = startDate instanceof Date ? startDate : new Date(startDate)

  let y = header(doc, brandId, 'WEEKLY REPORT',
    `Week of ${d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}`)

  const goals = [
    ['Goal 1', weekData.goal1 || '—'],
    ['Goal 2', weekData.goal2 || '—'],
    ['Goal 3', weekData.goal3 || '—'],
  ]
  y = sectionCard(doc, y, 'Weekly Goals', goals, getBrandColor(brandId))

  const business = [
    ['Revenue', weekData.revenue || '—'],
    ['New Clients', weekData.clients || '—'],
    ['Projects', weekData.projects || '—'],
  ]
  y = sectionCard(doc, y + 4, 'Business Metrics', business, getBrandColor(brandId))

  const reflect = [
    ['Weekly Reflection', weekData.reflection || '—'],
    ['Next Week Focus', weekData.nextWeekFocus || '—'],
    ['Score (1-10)', weekData.score || '—'],
  ]
  y = sectionCard(doc, y + 4, 'Reflection', reflect, getBrandColor(brandId))

  footer(doc, 1)
  doc.save(`BRANI_Weekly_${d.toISOString().split('T')[0]}.pdf`)
}
