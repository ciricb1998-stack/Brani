import { useState, useRef } from 'react'
import { useApp } from '../App.jsx'
import { exportDailyPDF, exportWeeklyPDF, exportMonthlyPDF } from '../utils/pdfExport.js'
import { loadDayData, loadWeekData, exportAllData, importAllData } from '../utils/storage.js'
import { MONTHS } from '../data/months.js'
import { CalendarBlank, FileText, DownloadSimple, UploadSimple, CaretRight } from '@phosphor-icons/react'

export default function ExportScreen() {
  const { settings, selectedDate, t } = useApp()
  const [loading, setLoading] = useState(null)
  const [importStatus, setImportStatus] = useState('')
  const fileRef = useRef()
  const today = new Date()

  async function doExport(type) {
    setLoading(type)
    await new Promise(r => setTimeout(r, 400))
    try {
      if (type === 'daily') {
        exportDailyPDF(loadDayData(selectedDate), selectedDate, settings.brand)
      } else if (type === 'weekly') {
        exportWeeklyPDF(loadWeekData(selectedDate), selectedDate, settings.brand)
      } else if (type === 'monthly') {
        const year = selectedDate.getFullYear()
        const month = selectedDate.getMonth() + 1
        const daysData = {}
        for (let d = 1; d <= 31; d++) {
          const date = new Date(year, month-1, d)
          if (date.getMonth() + 1 !== month) break
          const key = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
          daysData[key] = loadDayData(date)
        }
        exportMonthlyPDF(year, month, daysData, settings.brand)
      } else if (type === 'json') {
        const data = exportAllData()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `BRANI_backup_${today.toISOString().split('T')[0]}.json`
        a.click(); URL.revokeObjectURL(url)
      }
    } catch (e) {
      console.error('Export error:', e)
      alert('Export greška: ' + e.message)
    }
    setLoading(null)
  }

  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        const ok = importAllData(data)
        if (ok) {
          setImportStatus('success')
          setTimeout(() => { setImportStatus(''); window.location.reload() }, 2000)
        } else {
          setImportStatus('error')
          setTimeout(() => setImportStatus(''), 3000)
        }
      } catch {
        setImportStatus('error')
        setTimeout(() => setImportStatus(''), 3000)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const month = MONTHS[selectedDate.getMonth()]

  const exports = [
    {
      id: 'daily',
      title: t.daily_report,
      sub: `${selectedDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} · Premium PDF`,
      icon: <CalendarBlank weight="fill" size={20} />,
      badge: 'PDF'
    },
    {
      id: 'weekly',
      title: t.weekly_report,
      sub: `${t.week_from} ${selectedDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} · Premium PDF`,
      icon: <FileText size={20} />,
      badge: 'PDF'
    },
    {
      id: 'monthly',
      title: `${t.monthly_calendar} — ${month.name[settings.lang] || month.name.bs}`,
      sub: `${selectedDate.getFullYear()} · Landscape PDF`,
      icon: <CalendarBlank weight="fill" size={20} />,
      badge: 'PDF'
    },
    {
      id: 'json',
      title: t.backup_all,
      sub: t.backup_sub,
      icon: <DownloadSimple weight="fill" size={20} />,
      badge: 'JSON'
    }
  ]

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div>
          <div className="screen-label">EXPORT</div>
          <div className="screen-title">{t.export_title}</div>
          <div className="screen-sub">{t.export_sub}</div>
        </div>
        <span className="badge badge-accent">PREMIUM</span>
      </div>

      {/* Active brand info */}
      <div className="card" style={{ marginBottom: 16, background: 'var(--accent-dim)', border: '0.5px solid var(--accent)' }}>
        <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{t.active_brand_label}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
          {settings.brand === 'branip' ? 'BRANI+ Digitale Lösungen' : settings.brand === 'log' ? 'LOG — Ledger of Growth' : 'BRANI Personal Brand'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{t.pdf_branded}</div>
      </div>

      {/* Export cards */}
      {exports.map(exp => (
        <div key={exp.id} className="export-card" onClick={() => !loading && doExport(exp.id)} style={{ opacity: loading && loading !== exp.id ? 0.5 : 1 }}>
          <div className="export-icon">{exp.icon}</div>
          <div style={{ flex: 1 }}>
            <div className="export-title">{exp.title}</div>
            <div className="export-sub">{exp.sub}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-accent" style={{ fontSize: 9 }}>{exp.badge}</span>
            {loading === exp.id ? (
              <span style={{ color: 'var(--accent)', fontSize: 18, animation: 'pulse 1s ease infinite' }}>◌</span>
            ) : (
              <CaretRight size={18} style={{ color: 'var(--text-dimmer)' }} />
            )}
          </div>
        </div>
      ))}

      {/* Import section */}
      <div className="section-title">{t.import_restore}</div>
      <div className="card">
        <div className="card-glow" />
        <div className="card-header">
          <div className="card-icon">
            <UploadSimple weight="fill" size={18} />
          </div>
          <div>
            <div className="card-title">{t.restore_json}</div>
            <div className="card-sub">{t.restore_json_sub}</div>
          </div>
        </div>

        {importStatus === 'success' && (
          <div style={{ fontSize: 12, color: 'var(--green)', padding: '8px 10px', background: 'var(--green-dim)', borderRadius: 6, marginBottom: 10 }}>
            ✓ {t.import_success}
          </div>
        )}
        {importStatus === 'error' && (
          <div style={{ fontSize: 12, color: 'var(--red)', padding: '8px 10px', background: 'var(--red-dim)', borderRadius: 6, marginBottom: 10 }}>
            ✗ {t.import_error}
          </div>
        )}

        <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 12 }}>
          {t.import_desc}
        </div>

        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
        <button className="btn btn-outline" onClick={() => fileRef.current.click()}>
          <UploadSimple weight="fill" size={16} />
          {t.load_backup}
        </button>
      </div>

      <div style={{ padding: '16px 0 4px', fontSize: 11, color: 'var(--text-dimmer)', textAlign: 'center' }}>
        {t.weekly_backup_tip}
      </div>
    </div>
  )
}
