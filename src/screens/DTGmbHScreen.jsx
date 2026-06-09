import { useState, useRef, useEffect } from 'react'
import {
  SquaresFour, ClipboardText, HardDrive, BookOpen, CalendarBlank, FileText,
  Desktop, Laptop, Database, Printer, WifiHigh, Monitor, Phone, Package,
  Code, Lock, Envelope, Folder, Globe,
  MagnifyingGlass, PencilSimple, Trash, Plus, Camera,
  Image as PhosImage, CheckCircle, Warning, Fire, Lightning,
  X as XIcon, Eye, ShieldWarning, CaretDown, CaretUp, LinkSimple,
  ArrowClockwise, Clock, SealCheck, Checks,
} from '@phosphor-icons/react'
import {
  loadTickets, createTicket, updateTicket, deleteTicket, getTicketPhotos, setTicketPhotos, getSLAStatus,
  loadDevices, createDevice, updateDevice, deleteDevice, getDevicePhotos,
  loadWiki, createWikiEntry, updateWikiEntry, deleteWikiEntry, hitWikiEntry,
  loadWartungen, createWartung, updateWartung, deleteWartung,
  getTodayActivity, getMentorToken, pushMentorData,
} from '../utils/dtStorage.js'
import { supabase } from '../utils/supabase.js'
import jsPDF from 'jspdf'

// ── Tokens ────────────────────────────────────────────────────────────────────
const A = '#F97316', A2 = '#EA580C'
const BG = '#080808', C = '#0f0f0f', C2 = '#141414', BR = '#1a1a1a'
const TX = '#e8e8e8', DM = '#555', D2 = '#333'
const PW = 'fill'

const STATUS = {
  open:        { l: 'Offen',          c: '#F97316' },
  in_progress: { l: 'In Bearbeitung', c: '#3B82F6' },
  done:        { l: 'Erledigt',       c: '#22C55E' },
  escalated:   { l: 'Eskaliert',      c: '#EF4444' },
  waiting:     { l: 'Wartend',        c: '#A855F7' },
}
const PRIO = {
  niedrig:  { l: 'Niedrig',  c: '#22C55E' },
  mittel:   { l: 'Mittel',   c: '#F97316' },
  hoch:     { l: 'Hoch',     c: '#EF4444' },
  kritisch: { l: 'Kritisch', c: '#DC2626' },
}
const PRIO_SLA = { niedrig:'24h / 3d', mittel:'8h / 48h', hoch:'4h / 8h', kritisch:'15m / 1h' }
const DEV_TYPES = ['PC/Desktop','Laptop','Server','Drucker','Switch/Router','Monitor','Telefon','Sonstiges']
const DEV_STATUS = {
  aktiv:        { l: 'Aktiv',        c: '#22C55E' },
  defekt:       { l: 'Defekt',       c: '#EF4444' },
  in_reparatur: { l: 'In Reparatur', c: '#F97316' },
  ausgemustert: { l: 'Ausgemustert', c: '#555' },
}
const WIKI_TAGS = ['Netzwerk','Hardware','Software','Drucker','Server','E-Mail','VPN','Telefon','Sonstiges']
const TAG_COLOR = { Netzwerk:'#3B82F6',Hardware:'#F97316',Software:'#A855F7',Drucker:'#22C55E',Server:'#EF4444','E-Mail':'#F59E0B',VPN:'#14B8A6',Telefon:'#EC4899',Sonstiges:'#555' }
const WART_TYPES = ['Software-Update','Hardware-Check','Backup','Netzwerk','Sicherheit','Reinigung','Sonstiges']
const WART_STATUS = {
  geplant:     { l:'Geplant',         c:'#3B82F6' },
  in_progress: { l:'In Durchführung', c:'#F97316' },
  erledigt:    { l:'Erledigt',        c:'#22C55E' },
  verschoben:  { l:'Verschoben',      c:'#A855F7' },
  abgebrochen: { l:'Abgebrochen',     c:'#EF4444' },
}
const TICKET_CATS = ['Hardware','Software','Netzwerk','Drucker','Telefon','Zugang/Login','Server','Sonstiges']
const TICKET_CHANNELS = [['telefonisch','Telefonisch'],['email','E-Mail'],['vor_ort','Vor Ort'],['remote','Remote'],['intern','Intern']]

const fmt  = iso => iso ? new Date(iso).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}) : '—'
const fmtT = iso => iso ? new Date(iso).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—'

// ── Device icon ───────────────────────────────────────────────────────────────
function DevTypeIcon({ type, size=18, color=DM }) {
  const p = { size, color, weight:PW }
  if (type==='Laptop')        return <Laptop {...p}/>
  if (type==='Server')        return <Database {...p}/>
  if (type==='Drucker')       return <Printer {...p}/>
  if (type==='Switch/Router') return <WifiHigh {...p}/>
  if (type==='Monitor')       return <Monitor {...p}/>
  if (type==='Telefon')       return <Phone {...p}/>
  if (type==='Sonstiges')     return <Package {...p}/>
  return <Desktop {...p}/>
}

function WikiTagIcon({ tag, size=16, color=DM }) {
  const p = { size, color, weight:PW }
  if (tag==='Netzwerk') return <Globe {...p}/>
  if (tag==='Hardware') return <HardDrive {...p}/>
  if (tag==='Software') return <Code {...p}/>
  if (tag==='Drucker')  return <Printer {...p}/>
  if (tag==='Server')   return <Database {...p}/>
  if (tag==='E-Mail')   return <Envelope {...p}/>
  if (tag==='VPN')      return <Lock {...p}/>
  if (tag==='Telefon')  return <Phone {...p}/>
  return <Folder {...p}/>
}

// ── compress ──────────────────────────────────────────────────────────────────
async function compressImg(file) {
  return new Promise(res => {
    const img = new Image(), url = URL.createObjectURL(file)
    img.onload = () => {
      const s=Math.min(1,1000/img.width), w=img.width*s|0, h=img.height*s|0
      const c=document.createElement('canvas'); c.width=w; c.height=h
      c.getContext('2d').drawImage(img,0,0,w,h)
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg',0.72))
    }
    img.onerror = () => { URL.revokeObjectURL(url); res(null) }
    img.src = url
  })
}

// ── Atoms ─────────────────────────────────────────────────────────────────────
function Pill({ color, label, sm }) {
  return <span style={{ fontSize:sm?8:9, fontWeight:800, letterSpacing:'0.6px', padding:sm?'2px 6px':'3px 9px', borderRadius:20, background:color+'18', color, border:`1px solid ${color}30`, whiteSpace:'nowrap' }}>{label}</span>
}

function SLABadge({ ticket }) {
  const sla = getSLAStatus(ticket)
  if (sla.state==='met'||sla.state==='ok') return null
  const Icon = sla.state==='breached' ? ShieldWarning : Clock
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:9, fontWeight:800, color:sla.color, background:sla.color+'12', border:`1px solid ${sla.color}30`, borderRadius:8, padding:'2px 7px', whiteSpace:'nowrap' }}>
      <Icon size={9} weight={PW} color={sla.color}/> {sla.label}
    </div>
  )
}

function Btn({ onClick, children, v='ghost', style={}, disabled }) {
  const vs = {
    primary: { background:A, color:'#fff', border:'none' },
    ghost:   { background:C2, color:DM, border:`1px solid ${BR}` },
    danger:  { background:'#EF444412', color:'#EF4444', border:'1px solid #EF444428' },
    orange:  { background:`linear-gradient(135deg,${A},${A2})`, color:'#fff', border:'none' },
  }[v]
  return <button onClick={onClick} disabled={disabled} style={{ cursor:disabled?'not-allowed':'pointer', fontFamily:'inherit', borderRadius:10, fontSize:11, fontWeight:700, letterSpacing:'0.4px', padding:'8px 14px', transition:'all .15s', opacity:disabled?.5:1, display:'flex', alignItems:'center', gap:5, justifyContent:'center', ...vs, ...style }}>{children}</button>
}

function IconBtn({ onClick, children, danger, style={} }) {
  return <button onClick={onClick} style={{ cursor:'pointer', background:danger?'#EF444412':C2, border:`1px solid ${danger?'#EF444428':BR}`, borderRadius:9, padding:'7px', display:'flex', alignItems:'center', justifyContent:'center', color:danger?'#EF4444':DM, ...style }}>{children}</button>
}

function FInput({ label, value, onChange, placeholder, type='text', multiline, grid, required }) {
  const s = { width:'100%', background:C2, border:`1px solid ${BR}`, borderRadius:10, color:TX, fontFamily:'inherit', fontSize:13, padding:'10px 12px', outline:'none', boxSizing:'border-box' }
  return (
    <div style={{ marginBottom:11, ...(grid?{gridColumn:grid}:{}) }}>
      {label && <div style={{ fontSize:8, fontWeight:700, color:DM, letterSpacing:'1.5px', marginBottom:4, textTransform:'uppercase' }}>{label}{required&&<span style={{color:A}}> *</span>}</div>}
      {multiline ? <textarea rows={3} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ ...s, resize:'vertical', minHeight:64 }}/> : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={s}/>}
    </div>
  )
}
function FSel({ label, value, onChange, options, grid }) {
  return (
    <div style={{ marginBottom:11, ...(grid?{gridColumn:grid}:{}) }}>
      {label && <div style={{ fontSize:8, fontWeight:700, color:DM, letterSpacing:'1.5px', marginBottom:4, textTransform:'uppercase' }}>{label}</div>}
      <select value={value} onChange={e=>onChange(e.target.value)} style={{ width:'100%', background:C2, border:`1px solid ${BR}`, borderRadius:10, color:TX, fontFamily:'inherit', fontSize:13, padding:'10px 12px', outline:'none', appearance:'none' }}>
        {options.map(([v,l])=><option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  )
}

// ── Photos ────────────────────────────────────────────────────────────────────
function Photos({ photos=[], onChange }) {
  const ref = useRef()
  const [lb, setLb] = useState(null)
  const [loading, setLoading] = useState(false)
  async function onFiles(e) {
    const files=[...(e.target.files||[])].slice(0,6-photos.length)
    if(!files.length) return
    setLoading(true)
    const imgs=(await Promise.all(files.map(compressImg))).filter(Boolean)
    onChange([...photos,...imgs]); setLoading(false); e.target.value=''
  }
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:8, fontWeight:700, color:DM, letterSpacing:'1.5px', marginBottom:6, textTransform:'uppercase' }}>Fotos ({photos.length}/6)</div>
      {photos.length>0 && (
        <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:8 }}>
          {photos.map((src,i)=>(
            <div key={i} style={{ position:'relative', width:68, height:68, borderRadius:9, overflow:'hidden', border:`1px solid ${BR}`, flexShrink:0 }}>
              <img src={src} onClick={()=>setLb(src)} style={{ width:'100%', height:'100%', objectFit:'cover', cursor:'pointer' }}/>
              <button onClick={()=>onChange(photos.filter((_,j)=>j!==i))} style={{ position:'absolute', top:2, right:2, width:18, height:18, borderRadius:'50%', background:'rgba(0,0,0,0.8)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}>
                <XIcon size={10} weight={PW} color="#fff"/>
              </button>
            </div>
          ))}
        </div>
      )}
      {photos.length<6 && (
        <div style={{ display:'flex', gap:7 }}>
          <button onClick={()=>{ref.current.setAttribute('capture','environment');ref.current.click()}} disabled={loading} style={{ flex:1, padding:'10px', borderRadius:10, background:'#0f1a0f', border:`1px dashed ${A}55`, color:A, cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            <Camera size={15} weight={PW} color={A}/>{loading?'Lädt…':'Foto aufnehmen'}
          </button>
          <button onClick={()=>{ref.current.removeAttribute('capture');ref.current.click()}} style={{ padding:'10px 12px', borderRadius:10, background:C2, border:`1px solid ${BR}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <PhosImage size={16} weight={PW} color={DM}/>
          </button>
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={onFiles}/>
      {lb && (
        <div onClick={()=>setLb(null)} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.96)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <img src={lb} style={{ maxWidth:'95vw', maxHeight:'90dvh', borderRadius:12 }}/>
          <button onClick={()=>setLb(null)} style={{ position:'absolute', top:20, right:20, background:'#111', border:`1px solid ${BR}`, borderRadius:10, cursor:'pointer', padding:'6px 10px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <XIcon size={16} weight={PW} color={TX}/>
          </button>
        </div>
      )}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:9500, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}
      onClick={onClose}
    >
      <div
        onClick={e=>e.stopPropagation()}
        style={{
          width:'100%', maxWidth:560,
          height:'94dvh',           // fixed height — required for inner scroll to work
          background:C, borderRadius:'20px 20px 0 0',
          border:`1px solid ${BR}`, borderBottom:'none',
          display:'flex', flexDirection:'column',
          overflow:'hidden',
        }}
      >
        {/* sticky header */}
        <div style={{ flexShrink:0, background:C, padding:'16px 18px 13px', borderBottom:`1px solid ${BR}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:13, fontWeight:800, color:TX }}>{title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', padding:4, display:'flex', alignItems:'center' }}>
            <XIcon size={20} weight={PW} color={DM}/>
          </button>
        </div>
        {/* scrollable body — min-height:0 is the iOS flex+overflow fix */}
        <div style={{ flex:1, minHeight:0, overflowY:'auto', WebkitOverflowScrolling:'touch', padding:'16px 18px', paddingBottom:'calc(env(safe-area-inset-bottom,0px) + 28px)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════
function DashboardTab({ tickets, devices, onTab }) {
  const [now, setNow] = useState(new Date())
  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()),30000); return ()=>clearInterval(t) },[])

  const open    = tickets.filter(t=>t.status==='open')
  const inProg  = tickets.filter(t=>t.status==='in_progress')
  const done    = tickets.filter(t=>t.status==='done')
  const breached= tickets.filter(t=>getSLAStatus(t).state==='breached')
  const warning = tickets.filter(t=>getSLAStatus(t).state==='warning')
  const critical= tickets.filter(t=>t.priority==='kritisch'&&t.status!=='done')
  const act     = getTodayActivity()

  const kpi = [
    { l:'Offen',     v:open.length,    c:'#F97316', I:ClipboardText },
    { l:'Aktiv',     v:inProg.length,  c:'#3B82F6', I:Lightning     },
    { l:'Erledigt',  v:done.length,    c:'#22C55E', I:CheckCircle   },
    { l:'SLA Breach',v:breached.length,c:'#EF4444', I:ShieldWarning },
    { l:'SLA Warn',  v:warning.length, c:'#F59E0B', I:Warning       },
    { l:'Kritisch',  v:critical.length,c:'#DC2626', I:Fire          },
  ]
  const urgent = [...breached,...critical].filter((t,i,a)=>a.indexOf(t)===i).slice(0,5)

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:20 }}>
        {kpi.map(k=>(
          <div key={k.l} onClick={()=>onTab('tickets')} style={{ background:C, border:`1px solid ${BR}`, borderRadius:13, padding:'12px 10px', textAlign:'center', cursor:'pointer' }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:5 }}><k.I size={16} weight={PW} color={k.c}/></div>
            <div style={{ fontSize:26, fontWeight:900, color:k.c, fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{k.v}</div>
            <div style={{ fontSize:8, fontWeight:700, color:DM, letterSpacing:'0.5px', marginTop:3 }}>{k.l}</div>
          </div>
        ))}
      </div>

      <div style={{ background:C, border:`1px solid ${BR}`, borderRadius:13, padding:'13px 15px', marginBottom:14 }}>
        <div style={{ fontSize:9, fontWeight:700, color:DM, letterSpacing:'1.5px', marginBottom:10 }}>
          HEUTE — {now.toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit'}).toUpperCase()}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[
            [`${act.openedToday.length} Ticket${act.openedToday.length!==1?'s':''} eröffnet`,'#F97316'],
            [`${act.resolvedToday.length} Ticket${act.resolvedToday.length!==1?'s':''} erledigt`,'#22C55E'],
            [`${act.devicesAddedToday.length} Gerät${act.devicesAddedToday.length!==1?'e':''} erfasst`,'#3B82F6'],
            [`${act.wikiAddedToday.length} Wiki-Einträge`,'#A855F7'],
          ].map(([l,c])=>(
            <div key={l} style={{ background:C2, borderRadius:9, padding:'9px 10px', borderLeft:`3px solid ${c}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:TX }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {urgent.length>0 && (
        <div style={{ marginBottom:4 }}>
          <div style={{ fontSize:9, fontWeight:700, color:'#EF4444', letterSpacing:'1.5px', marginBottom:8, display:'flex', alignItems:'center', gap:5 }}>
            <ShieldWarning size={11} weight={PW} color="#EF4444"/> SOFORT BEARBEITEN
          </div>
          {urgent.map(t=>{
            const sla=getSLAStatus(t)
            return (
              <div key={t.id} onClick={()=>onTab('tickets')} style={{ background:'#1a0808', border:'1px solid #EF444430', borderRadius:12, padding:'11px 13px', marginBottom:7, cursor:'pointer', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:4, height:40, borderRadius:2, background:PRIO[t.priority]?.c||A, flexShrink:0 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:800, color:'#FF6B6B' }}>{t.number} · {t.title}</div>
                  <div style={{ fontSize:10, color:'#888', marginTop:2 }}>{PRIO[t.priority]?.l} · {STATUS[t.status]?.l}</div>
                </div>
                <SLABadge ticket={t}/>
              </div>
            )
          })}
        </div>
      )}

      {urgent.length===0&&open.length===0 && (
        <div style={{ background:C, borderRadius:13, padding:24, textAlign:'center' }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}><CheckCircle size={28} weight={PW} color="#22C55E"/></div>
          <div style={{ fontSize:13, fontWeight:700, color:'#22C55E' }}>Alles erledigt</div>
          <div style={{ fontSize:11, color:DM, marginTop:4 }}>Keine offenen oder kritischen Tickets</div>
        </div>
      )}

      <div style={{ background:C, border:`1px solid ${BR}`, borderRadius:12, padding:'11px 14px', marginTop:14 }}>
        <div style={{ fontSize:9, fontWeight:700, color:DM, letterSpacing:'1.5px', marginBottom:8 }}>SLA REAKTIONSZEITEN</div>
        {Object.entries(PRIO).map(([k,p])=>(
          <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:`1px solid ${D2}` }}>
            <Pill color={p.c} label={p.l} sm/>
            <span style={{ fontSize:10, color:DM }}>{PRIO_SLA[k]}</span>
          </div>
        ))}
      </div>

      <QuickGuide/>
    </div>
  )
}

function QuickGuide() {
  const [open, setOpen] = useState(false)
  const steps = [
    { t:'Ticket erstellen', d:'Tickets Tab → + Button → Titel, Priorität, Beschreibung ausfüllen → Gerät verknüpfen → Speichern.' },
    { t:'Ticket bearbeiten', d:'Ticket antippen → Status ändern (Offen → In Bearbeitung → Erledigt) → Foto anhängen möglich.' },
    { t:'SLA überwachen', d:'Jedes Ticket hat eine SLA-Uhr. Orange = Warnung. Rot = Verletzt. Dashboard zeigt alle kritischen Tickets.' },
    { t:'Gerät erfassen', d:'Geräte Tab → + Button → R-Nummer wird automatisch vergeben → Typ, Modell, Benutzer eintragen.' },
    { t:'Wissensdatenbank', d:'Wissen Tab → + Button → Lösung dokumentieren → Tag wählen → Wiki wächst mit jeder Lösung.' },
    { t:'Wartungsplan', d:'Kalender Tab → + Button → Wartungstyp, Datum, Intervall, Verantwortlicher eintragen.' },
    { t:'Schichtbericht & Mentor', d:'Bericht Tab → PDF exportieren für Kunden. Mentor-Link erstellen damit Mentor live mitlesen kann.' },
  ]
  return (
    <div style={{ background:C, border:`1px solid ${A}25`, borderRadius:12, marginTop:14, overflow:'hidden' }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ width:'100%', background:'none', border:'none', cursor:'pointer', padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <BookOpen size={13} weight={PW} color={A}/>
          <span style={{ fontSize:10, fontWeight:800, color:A, letterSpacing:'1.5px' }}>QUICK GUIDE — WIE FUNKTIONIERT DAS SYSTEM?</span>
        </div>
        {open ? <CaretUp size={13} weight={PW} color={DM}/> : <CaretDown size={13} weight={PW} color={DM}/>}
      </button>
      {open && (
        <div style={{ padding:'0 14px 14px' }}>
          {steps.map((s,i)=>(
            <div key={i} style={{ display:'flex', gap:10, marginBottom:10 }}>
              <div style={{ width:20, height:20, borderRadius:'50%', background:`${A}18`, border:`1px solid ${A}40`, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:A, marginTop:1 }}>{i+1}</div>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:TX, marginBottom:2 }}>{s.t}</div>
                <div style={{ fontSize:11, color:DM, lineHeight:1.5 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// TICKETS
// ════════════════════════════════════════════════════════════
function TicketForm({ initial={}, devices: initialDevices, onSave }) {
  const [f, setF] = useState({ title:'', desc:'', priority:'mittel', status:'open', deviceId:'', assignee:'', melder:'', kategorie:'Hardware', kanal:'telefonisch', arbeitszeit:'', resolution:'', notes:'', ...initial })
  const [photos, setPhotos] = useState(initial.id ? getTicketPhotos(initial.id) : [])
  const [localDevices, setLocalDevices] = useState(initialDevices)
  const [showQuickDev, setShowQuickDev] = useState(false)
  const [qd, setQd] = useState({ name:'', type:'PC/Desktop', rNumber:'', userName:'', location:'' })
  const s = k => v => setF(p=>({...p,[k]:v}))

  function saveQuickDevice() {
    if (!qd.name.trim() && !qd.rNumber.trim()) return
    const d = createDevice(qd)
    setLocalDevices(prev => [d, ...prev])
    setF(p => ({...p, deviceId: d.id}))
    setShowQuickDev(false)
    setQd({ name:'', type:'PC/Desktop', rNumber:'', userName:'', location:'' })
  }

  return (
    <div>
      <FInput label="Titel" required value={f.title} onChange={s('title')} placeholder="Kurzbeschreibung des Problems"/>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <FSel label="Kategorie" value={f.kategorie} onChange={s('kategorie')} options={TICKET_CATS.map(c=>[c,c])}/>
        <FSel label="Kanal" value={f.kanal} onChange={s('kanal')} options={TICKET_CHANNELS}/>
        <FSel label="Priorität" value={f.priority} onChange={s('priority')} options={Object.entries(PRIO).map(([k,v])=>[k,v.l])}/>
        <FSel label="Status" value={f.status} onChange={s('status')} options={Object.entries(STATUS).map(([k,v])=>[k,v.l])}/>
      </div>
      <FInput label="Beschreibung" value={f.desc} onChange={s('desc')} multiline placeholder="Details zum Problem..."/>

      {/* Gerät mit Inline-Erstellung */}
      <div style={{ marginBottom:11 }}>
        <div style={{ fontSize:8, fontWeight:700, color:DM, letterSpacing:'1.5px', marginBottom:4, textTransform:'uppercase' }}>Gerät</div>
        <div style={{ display:'flex', gap:6 }}>
          <select value={f.deviceId} onChange={e=>s('deviceId')(e.target.value)} style={{ flex:1, background:C2, border:`1px solid ${BR}`, borderRadius:10, color:TX, fontFamily:'inherit', fontSize:13, padding:'10px 12px', outline:'none', appearance:'none' }}>
            <option value="">— kein Gerät —</option>
            {localDevices.map(d=><option key={d.id} value={d.id}>{d.rNumber} — {d.name||d.type}</option>)}
          </select>
          <button onClick={()=>setShowQuickDev(v=>!v)} style={{ padding:'0 13px', borderRadius:10, background:showQuickDev?A:`${A}15`, border:`1px solid ${A}40`, cursor:'pointer', color:showQuickDev?'#fff':A, fontSize:11, fontWeight:700, flexShrink:0, display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap' }}>
            <Plus size={12} weight={PW} color={showQuickDev?'#fff':A}/> Neu
          </button>
        </div>
        {showQuickDev && (
          <div style={{ marginTop:8, background:'#0f1a0a', border:`1px solid ${A}35`, borderRadius:10, padding:'12px' }}>
            <div style={{ fontSize:8, fontWeight:700, color:A, letterSpacing:'1.5px', marginBottom:10 }}>NEUES GERÄT ERFASSEN & VERKNÜPFEN</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <FInput label="R-Nummer" value={qd.rNumber} onChange={v=>setQd(p=>({...p,rNumber:v}))} placeholder="R-001"/>
              <FInput label="Gerätename" value={qd.name} onChange={v=>setQd(p=>({...p,name:v}))} placeholder="PC-Empfang"/>
              <FSel label="Typ" value={qd.type} onChange={v=>setQd(p=>({...p,type:v}))} options={DEV_TYPES.map(t=>[t,t])}/>
              <FInput label="Benutzer" value={qd.userName} onChange={v=>setQd(p=>({...p,userName:v}))} placeholder="Dr. Müller"/>
            </div>
            <FInput label="Standort" value={qd.location} onChange={v=>setQd(p=>({...p,location:v}))} placeholder="Zimmer 2 / Anmeldung"/>
            <div style={{ display:'flex', gap:6, marginTop:4 }}>
              <Btn v="primary" onClick={saveQuickDevice} style={{ flex:1 }}><Plus size={12} weight={PW} color="#fff"/> Anlegen & verknüpfen</Btn>
              <Btn onClick={()=>setShowQuickDev(false)}>Abbrechen</Btn>
            </div>
          </div>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <FInput label="Bearbeiter" value={f.assignee} onChange={s('assignee')} placeholder="Name"/>
        <FInput label="Melder / Benutzer" value={f.melder} onChange={s('melder')} placeholder="Wer hat gemeldet?"/>
      </div>
      {(f.status==='done'||f.status==='escalated') && (
        <>
          <FInput label="Lösung / Durchgeführte Maßnahmen" value={f.resolution} onChange={s('resolution')} multiline placeholder="Was wurde getan?"/>
          <FInput label="Arbeitszeit (Minuten)" type="number" value={f.arbeitszeit} onChange={s('arbeitszeit')} placeholder="z.B. 30"/>
        </>
      )}
      <FInput label="Interne Notizen" value={f.notes} onChange={s('notes')} multiline placeholder="Nur intern sichtbar..."/>
      <Photos photos={photos} onChange={setPhotos}/>
      <Btn v="primary" onClick={()=>{ if(!f.title.trim()) return; onSave(f,photos) }} style={{ width:'100%', marginTop:4 }}>
        <Plus size={13} weight={PW} color="#fff"/> {initial.id?'Änderungen speichern':'Ticket erstellen'}
      </Btn>
    </div>
  )
}

function TicketDetail({ ticket, devices, onClose, onEdit }) {
  const photos=getTicketPhotos(ticket.id), dev=devices.find(d=>d.id===ticket.deviceId)
  const sla=getSLAStatus(ticket), [lb,setLb]=useState(null)
  return (
    <Modal title={`${ticket.number} — Details`} onClose={onClose}>
      <div style={{ background:sla.state==='breached'?'#1a0808':sla.state==='warning'?'#1a1000':C2, border:`1px solid ${sla.color}30`, borderRadius:10, padding:'10px 13px', marginBottom:14, display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:9, fontWeight:700, color:DM, letterSpacing:'1px' }}>SLA STATUS</div>
          <div style={{ fontSize:12, fontWeight:800, color:sla.color }}>{sla.state==='met'||sla.state==='ok'?'Eingehalten':sla.state==='breached'?`VERLETZT — ${sla.label}`:`${sla.label} verbleibend`}</div>
        </div>
        <Pill color={PRIO[ticket.priority]?.c} label={PRIO[ticket.priority]?.l}/> <Pill color={STATUS[ticket.status]?.c} label={STATUS[ticket.status]?.l}/>
      </div>
      {[
        ['Titel',ticket.title],
        ['Kategorie',ticket.kategorie],
        ['Kanal',TICKET_CHANNELS.find(([k])=>k===ticket.kanal)?.[1]||ticket.kanal],
        ['Gerät',dev?`${dev.rNumber} — ${dev.name||dev.type}`:null],
        ['Bearbeiter',ticket.assignee],
        ['Melder',ticket.melder],
        ['Arbeitszeit',ticket.arbeitszeit?`${ticket.arbeitszeit} Minuten`:null],
        ['Beschreibung',ticket.desc],
        ['Lösung',ticket.resolution],
        ['Notizen',ticket.notes],
        ['Erstellt',fmtT(ticket.createdAt)],
        ['Erledigt',fmtT(ticket.resolvedAt)],
      ].filter(([,v])=>v).map(([k,v])=>(
        <div key={k} style={{ marginBottom:10 }}><div style={{ fontSize:8, fontWeight:700, color:DM, letterSpacing:'1.2px', marginBottom:2 }}>{k.toUpperCase()}</div><div style={{ fontSize:13, color:TX, lineHeight:1.5 }}>{v}</div></div>
      ))}
      {ticket.statusHistory?.length>1 && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:8, fontWeight:700, color:DM, letterSpacing:'1.2px', marginBottom:6 }}>VERLAUF</div>
          {ticket.statusHistory.map((h,i)=>(
            <div key={i} style={{ display:'flex', gap:8, alignItems:'center', padding:'4px 0', borderBottom:`1px solid ${D2}` }}>
              <Pill color={STATUS[h.status]?.c||A} label={STATUS[h.status]?.l||h.status} sm/><span style={{ fontSize:10, color:DM }}>{fmtT(h.at)}</span>
            </div>
          ))}
        </div>
      )}
      {photos.length>0 && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:8, fontWeight:700, color:DM, letterSpacing:'1.2px', marginBottom:8 }}>FOTOS ({photos.length})</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
            {photos.map((src,i)=><img key={i} src={src} onClick={()=>setLb(src)} style={{ width:'100%', aspectRatio:'1', borderRadius:9, objectFit:'cover', border:`1px solid ${BR}`, cursor:'pointer' }}/>)}
          </div>
        </div>
      )}
      <div style={{ display:'flex', gap:8 }}><Btn v="primary" onClick={onEdit} style={{ flex:1 }}><PencilSimple size={13} weight={PW} color="#fff"/> Bearbeiten</Btn><Btn onClick={onClose} style={{ flex:1 }}>Schließen</Btn></div>
      {lb && <div onClick={()=>setLb(null)} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.96)', display:'flex', alignItems:'center', justifyContent:'center' }}><img src={lb} style={{ maxWidth:'95vw', maxHeight:'90dvh', borderRadius:12 }}/></div>}
    </Modal>
  )
}

function TicketsTab({ tickets, devices, reload }) {
  const [showNew,setShowNew]=useState(false), [editing,setEditing]=useState(null), [detail,setDetail]=useState(null)
  const [fs,setFs]=useState('all'), [slaF,setSlaF]=useState('all'), [search,setSearch]=useState('')
  const [,tick]=useState(0)
  useEffect(()=>{ const t=setInterval(()=>tick(n=>n+1),60000); return ()=>clearInterval(t) },[])

  const list=tickets
    .filter(t=>fs==='all'||t.status===fs)
    .filter(t=>{ if(slaF==='breached') return getSLAStatus(t).state==='breached'; if(slaF==='warning') return getSLAStatus(t).state==='warning'; return true })
    .filter(t=>!search||[t.number,t.title,t.assignee].join(' ').toLowerCase().includes(search.toLowerCase()))

  const doCreate=(f,p)=>{ const t=createTicket(f); if(p.length) setTicketPhotos(t.id,p); reload(); setShowNew(false) }
  const doUpdate=(f,p)=>{ const resolved=f.status==='done'&&editing.status!=='done'?new Date().toISOString():editing.resolvedAt; updateTicket(editing.id,{...f,resolvedAt:resolved}); setTicketPhotos(editing.id,p); reload(); setEditing(null) }
  const quickStatus=(t,newStatus)=>{ if(t.status===newStatus) return; const resolved=newStatus==='done'&&t.status!=='done'?new Date().toISOString():t.resolvedAt; updateTicket(t.id,{status:newStatus,resolvedAt:resolved}); reload() }

  const fBtn=(active,label,onClick,ac=A)=>(
    <button onClick={onClick} style={{ flexShrink:0, fontSize:8, fontWeight:700, padding:'4px 10px', borderRadius:20, cursor:'pointer', fontFamily:'inherit', background:active?ac:C2, border:`1px solid ${active?ac:BR}`, color:active?'#fff':DM, transition:'all .15s' }}>{label}</button>
  )

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:10 }}>
        <div style={{ flex:1, position:'relative' }}>
          <MagnifyingGlass size={13} weight={PW} color={DM} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Suchen…" style={{ width:'100%', background:C2, border:`1px solid ${BR}`, borderRadius:10, color:TX, fontFamily:'inherit', fontSize:12, padding:'8px 12px 8px 32px', outline:'none', boxSizing:'border-box' }}/>
        </div>
        <Btn v="primary" onClick={()=>setShowNew(true)}><Plus size={13} weight={PW} color="#fff"/> Ticket</Btn>
      </div>
      <div style={{ display:'flex', gap:5, overflowX:'auto', paddingBottom:4, marginBottom:5, scrollbarWidth:'none' }}>
        {[['all','Alle'],...Object.entries(STATUS).map(([k,v])=>[k,v.l])].map(([k,l])=>fBtn(fs===k,l,()=>setFs(k)))}
      </div>
      <div style={{ display:'flex', gap:5, overflowX:'auto', paddingBottom:4, marginBottom:12, scrollbarWidth:'none' }}>
        {[['all','Alle SLA'],['breached','Verletzt'],['warning','Warnung']].map(([k,l])=>fBtn(slaF===k,l,()=>setSlaF(k),k==='breached'?'#EF4444':k==='warning'?'#F97316':A))}
      </div>
      {list.length===0 && <div style={{ background:C, borderRadius:12, padding:28, textAlign:'center', color:DM, fontSize:12 }}>Keine Tickets gefunden</div>}
      {list.map(t=>{
        const s=STATUS[t.status]||STATUS.open, p=PRIO[t.priority]||PRIO.mittel
        const dev=devices.find(d=>d.id===t.deviceId), photos=getTicketPhotos(t.id)
        return (
          <div key={t.id} style={{ background:C, border:`1px solid ${t.priority==='kritisch'&&t.status!=='done'?'#EF444435':BR}`, borderRadius:13, padding:'13px 14px', marginBottom:9 }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:9, marginBottom:6 }}>
              <div style={{ width:3, borderRadius:2, background:p.c, flexShrink:0, alignSelf:'stretch', minHeight:36 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3, flexWrap:'wrap' }}>
                  <span style={{ fontSize:10, fontWeight:800, color:A }}>{t.number}</span>
                  <Pill color={p.c} label={p.l} sm/><Pill color={s.c} label={s.l} sm/><SLABadge ticket={t}/>
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:TX, lineHeight:1.3 }}>{t.title}</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:3, flexWrap:'wrap' }}>
                  {t.kategorie && <span style={{ fontSize:8, fontWeight:700, padding:'2px 7px', borderRadius:12, background:`${A}15`, color:A, border:`1px solid ${A}25` }}>{t.kategorie}</span>}
                  {t.kanal && <span style={{ fontSize:8, color:DM }}>{TICKET_CHANNELS.find(([k])=>k===t.kanal)?.[1]||t.kanal}</span>}
                  {dev && <span style={{ fontSize:10, color:DM, display:'flex', alignItems:'center', gap:3 }}><DevTypeIcon type={dev.type} size={10} color={DM}/>{dev.rNumber} · {dev.name||dev.type}</span>}
                  {t.melder && <span style={{ fontSize:9, color:'#888' }}>von {t.melder}</span>}
                </div>
              </div>
            </div>
            {t.desc && <div style={{ fontSize:12, color:'#666', lineHeight:1.5, marginBottom:7, paddingLeft:12 }}>{t.desc.slice(0,120)}{t.desc.length>120?'…':''}</div>}
            {photos.length>0 && (
              <div style={{ display:'flex', gap:5, paddingLeft:12, marginBottom:7 }}>
                {photos.slice(0,4).map((src,i)=><img key={i} src={src} style={{ width:44, height:44, borderRadius:6, objectFit:'cover', border:`1px solid ${BR}`, cursor:'pointer' }} onClick={()=>setDetail(t)}/>)}
                {photos.length>4 && <div style={{ width:44, height:44, borderRadius:6, background:C2, border:`1px solid ${BR}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:DM }}>+{photos.length-4}</div>}
              </div>
            )}
            {/* Quick Status */}
            <div style={{ display:'flex', gap:4, paddingLeft:12, marginBottom:7, flexWrap:'wrap' }}>
              {Object.entries(STATUS).map(([k,v])=>(
                <button key={k} onClick={()=>quickStatus(t,k)} style={{ fontSize:8, fontWeight:700, padding:'4px 10px', borderRadius:20, cursor:t.status===k?'default':'pointer', fontFamily:'inherit', background:t.status===k?v.c:'transparent', border:`1px solid ${t.status===k?v.c:BR}`, color:t.status===k?'#fff':DM, transition:'all .12s' }}>{v.l}</button>
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingLeft:12 }}>
              <span style={{ fontSize:9, color:D2 }}>{fmtT(t.createdAt)}{t.assignee&&` · ${t.assignee}`}</span>
              <div style={{ display:'flex', gap:5 }}>
                <IconBtn onClick={()=>setDetail(t)}><Eye size={14} weight={PW} color={DM}/></IconBtn>
                <IconBtn onClick={()=>setEditing(t)}><PencilSimple size={14} weight={PW} color={DM}/></IconBtn>
                <IconBtn danger onClick={()=>{ if(confirm('Ticket löschen?')){deleteTicket(t.id);reload()} }}><Trash size={14} weight={PW} color="#EF4444"/></IconBtn>
              </div>
            </div>
          </div>
        )
      })}
      {showNew && <Modal title="Neues Ticket" onClose={()=>setShowNew(false)}><TicketForm devices={devices} onSave={doCreate}/></Modal>}
      {editing && <Modal title={`${editing.number} bearbeiten`} onClose={()=>setEditing(null)}><TicketForm initial={editing} devices={devices} onSave={doUpdate}/></Modal>}
      {detail && <TicketDetail ticket={detail} devices={devices} onClose={()=>setDetail(null)} onEdit={()=>{setEditing(detail);setDetail(null)}}/>}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// GERÄTE
// ════════════════════════════════════════════════════════════
function DeviceForm({ initial={}, onSave }) {
  const [f,setF]=useState({ name:'',type:'PC/Desktop',model:'',serial:'',rNumber:'',location:'',userName:'',ipAddress:'',os:'',status:'aktiv',notes:'',...initial })
  const [photos,setPhotos]=useState(initial.id?getDevicePhotos(initial.id):[])
  const s=k=>v=>setF(p=>({...p,[k]:v}))
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <FInput label="R-Nummer" value={f.rNumber} onChange={s('rNumber')} placeholder="R-001"/>
        <FInput label="Gerätename" value={f.name} onChange={s('name')} placeholder="PC-Empfang"/>
        <FSel label="Typ" value={f.type} onChange={s('type')} options={DEV_TYPES.map(t=>[t,t])}/>
        <FSel label="Status" value={f.status} onChange={s('status')} options={Object.entries(DEV_STATUS).map(([k,v])=>[k,v.l])}/>
        <FInput label="Modell" value={f.model} onChange={s('model')} placeholder="Lenovo ThinkCentre"/>
        <FInput label="Seriennummer" value={f.serial} onChange={s('serial')} placeholder="SN12345"/>
        <FInput label="Benutzer" value={f.userName} onChange={s('userName')} placeholder="Dr. Müller"/>
        <FInput label="Standort" value={f.location} onChange={s('location')} placeholder="Zimmer 2"/>
        <FInput label="IP-Adresse" value={f.ipAddress} onChange={s('ipAddress')} placeholder="192.168.1.10"/>
        <FInput label="Betriebssystem" value={f.os} onChange={s('os')} placeholder="Windows 11 Pro"/>
      </div>
      <FInput label="Notizen" value={f.notes} onChange={s('notes')} multiline placeholder="Weitere Infos..."/>
      <Photos photos={photos} onChange={setPhotos}/>
      <Btn v="primary" onClick={()=>onSave(f,photos)} style={{ width:'100%', marginTop:4 }}>
        <Plus size={13} weight={PW} color="#fff"/> {initial.id?'Änderungen speichern':'Gerät anlegen'}
      </Btn>
    </div>
  )
}

function DevicesTab({ devices, reload }) {
  const [showNew,setShowNew]=useState(false), [editing,setEditing]=useState(null)
  const [search,setSearch]=useState(''), [fSt,setFSt]=useState('all')
  const saveDevPhotos=(id,photos)=>{ const ph=JSON.parse(localStorage.getItem('brani_dt_devices_photos')||'{}'); ph[id]=photos; localStorage.setItem('brani_dt_devices_photos',JSON.stringify(ph)) }
  const list=devices.filter(d=>fSt==='all'||d.status===fSt).filter(d=>!search||[d.rNumber,d.name,d.type,d.model,d.userName,d.location,d.ipAddress].join(' ').toLowerCase().includes(search.toLowerCase()))
  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:10 }}>
        <div style={{ flex:1, position:'relative' }}>
          <MagnifyingGlass size={13} weight={PW} color={DM} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Suchen…" style={{ width:'100%', background:C2, border:`1px solid ${BR}`, borderRadius:10, color:TX, fontFamily:'inherit', fontSize:12, padding:'8px 12px 8px 32px', outline:'none', boxSizing:'border-box' }}/>
        </div>
        <Btn v="primary" onClick={()=>setShowNew(true)}><Plus size={13} weight={PW} color="#fff"/> Gerät</Btn>
      </div>
      <div style={{ display:'flex', gap:5, marginBottom:12, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none' }}>
        {[['all','Alle'],...Object.entries(DEV_STATUS).map(([k,v])=>[k,v.l])].map(([k,l])=>(
          <button key={k} onClick={()=>setFSt(k)} style={{ flexShrink:0, fontSize:8, fontWeight:700, padding:'4px 10px', borderRadius:20, cursor:'pointer', fontFamily:'inherit', background:fSt===k?A:C2, border:`1px solid ${fSt===k?A:BR}`, color:fSt===k?'#fff':DM }}>{l}</button>
        ))}
      </div>
      {list.length===0 && <div style={{ background:C, borderRadius:12, padding:28, textAlign:'center', color:DM, fontSize:12 }}>Keine Geräte</div>}
      {list.map(d=>{
        const s=DEV_STATUS[d.status]||DEV_STATUS.aktiv, photos=getDevicePhotos(d.id)
        return (
          <div key={d.id} style={{ background:C, border:`1px solid ${BR}`, borderRadius:13, padding:'13px 14px', marginBottom:9 }}>
            <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:8 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:`${A}15`, border:`1px solid ${A}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <DevTypeIcon type={d.type} size={20} color={A}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:TX }}>{d.name||d.type}</div>
                <div style={{ fontSize:10, color:DM }}>{d.rNumber}{d.userName&&` · ${d.userName}`}{d.location&&` · ${d.location}`}</div>
              </div>
              <Pill color={s.c} label={s.l} sm/>
            </div>
            <div style={{ fontSize:10, color:D2, paddingLeft:50, marginBottom:7 }}>{[d.model,d.serial&&`SN:${d.serial}`,d.ipAddress&&`IP:${d.ipAddress}`,d.os].filter(Boolean).join(' · ')}</div>
            {photos.length>0 && <div style={{ display:'flex', gap:5, paddingLeft:50, marginBottom:8 }}>{photos.slice(0,4).map((s,i)=><img key={i} src={s} style={{ width:40, height:40, borderRadius:6, objectFit:'cover', border:`1px solid ${BR}` }}/>)}</div>}
            <div style={{ display:'flex', justifyContent:'flex-end', gap:6 }}>
              <Btn onClick={()=>setEditing(d)}><PencilSimple size={13} weight={PW} color={DM}/> Bearbeiten</Btn>
              <IconBtn danger onClick={()=>{ if(confirm('Gerät löschen?')){deleteDevice(d.id);reload()} }}><Trash size={14} weight={PW} color="#EF4444"/></IconBtn>
            </div>
          </div>
        )
      })}
      {showNew && <Modal title="Neues Gerät" onClose={()=>setShowNew(false)}><DeviceForm onSave={(f,p)=>{ const d=createDevice(f); saveDevPhotos(d.id,p); reload(); setShowNew(false) }}/></Modal>}
      {editing && <Modal title={`${editing.rNumber} bearbeiten`} onClose={()=>setEditing(null)}><DeviceForm initial={editing} onSave={(f,p)=>{ updateDevice(editing.id,{...f,photos:p}); reload(); setEditing(null) }}/></Modal>}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// WISSEN
// ════════════════════════════════════════════════════════════
function WikiTab({ wiki, reload }) {
  const [showNew,setShowNew]=useState(false), [editing,setEditing]=useState(null)
  const [search,setSearch]=useState(''), [fTag,setFTag]=useState('all'), [exp,setExp]=useState(null)
  const [form,setForm]=useState({ title:'',problem:'',solution:'',tag:'Sonstiges',verified:false })
  const sf=k=>v=>setForm(p=>({...p,[k]:v}))
  const list=wiki.filter(e=>fTag==='all'||e.tag===fTag).filter(e=>!search||[e.title,e.problem,e.solution].join(' ').toLowerCase().includes(search.toLowerCase()))
  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:10 }}>
        <div style={{ flex:1, position:'relative' }}>
          <MagnifyingGlass size={13} weight={PW} color={DM} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Wissensbasis durchsuchen…" style={{ width:'100%', background:C2, border:`1px solid ${BR}`, borderRadius:10, color:TX, fontFamily:'inherit', fontSize:12, padding:'8px 12px 8px 32px', outline:'none', boxSizing:'border-box' }}/>
        </div>
        <Btn v="primary" onClick={()=>{ setForm({title:'',problem:'',solution:'',tag:'Sonstiges',verified:false}); setEditing(null); setShowNew(true) }}><Plus size={13} weight={PW} color="#fff"/> Artikel</Btn>
      </div>
      <div style={{ display:'flex', gap:5, marginBottom:14, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none' }}>
        <button onClick={()=>setFTag('all')} style={{ flexShrink:0, fontSize:8, fontWeight:700, padding:'4px 10px', borderRadius:20, cursor:'pointer', fontFamily:'inherit', background:fTag==='all'?A:C2, border:`1px solid ${fTag==='all'?A:BR}`, color:fTag==='all'?'#fff':DM }}>Alle</button>
        {WIKI_TAGS.map(t=>(
          <button key={t} onClick={()=>setFTag(t)} style={{ flexShrink:0, fontSize:8, fontWeight:700, padding:'4px 10px', borderRadius:20, cursor:'pointer', fontFamily:'inherit', background:fTag===t?(TAG_COLOR[t]||A):C2, border:`1px solid ${fTag===t?(TAG_COLOR[t]||A):BR}`, color:fTag===t?'#fff':DM }}>{t}</button>
        ))}
      </div>
      {list.length===0 && <div style={{ background:C, borderRadius:12, padding:28, textAlign:'center', color:DM, fontSize:12 }}>Noch keine Artikel</div>}
      {list.map(e=>{
        const tc=TAG_COLOR[e.tag]||A, isExp=exp===e.id
        return (
          <div key={e.id} style={{ background:C, border:`1px solid ${isExp?tc+'50':BR}`, borderRadius:13, marginBottom:9, overflow:'hidden', transition:'border .2s' }}>
            <div onClick={()=>{ setExp(isExp?null:e.id); if(!isExp) hitWikiEntry(e.id) }} style={{ padding:'13px 14px', cursor:'pointer', display:'flex', gap:10, alignItems:'center' }}>
              <div style={{ width:34, height:34, borderRadius:8, background:tc+'18', border:`1px solid ${tc}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <WikiTagIcon tag={e.tag} size={16} color={tc}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:3 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:TX }}>{e.title}</span>
                  {e.verified && <SealCheck size={13} weight={PW} color="#22C55E"/>}
                </div>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}><Pill color={tc} label={e.tag} sm/><span style={{ fontSize:9, color:DM }}>{e.hits||0}× · {fmt(e.createdAt)}</span></div>
              </div>
              {isExp ? <CaretUp size={14} weight={PW} color={DM}/> : <CaretDown size={14} weight={PW} color={DM}/>}
            </div>
            {isExp && (
              <div style={{ padding:'0 14px 14px', borderTop:`1px solid ${BR}` }}>
                <div style={{ marginTop:12 }}><div style={{ fontSize:8, fontWeight:700, color:'#EF4444', letterSpacing:'1.2px', marginBottom:5 }}>PROBLEM / SYMPTOM</div><div style={{ fontSize:12, color:'#999', lineHeight:1.6, background:C2, borderRadius:8, padding:'10px 12px' }}>{e.problem||'—'}</div></div>
                <div style={{ marginTop:10 }}><div style={{ fontSize:8, fontWeight:700, color:'#22C55E', letterSpacing:'1.2px', marginBottom:5 }}>LÖSUNG</div><div style={{ fontSize:12, color:TX, lineHeight:1.7, background:'#0f1a0f', borderRadius:8, padding:'10px 12px', borderLeft:'3px solid #22C55E', whiteSpace:'pre-wrap' }}>{e.solution||'—'}</div></div>
                <div style={{ display:'flex', gap:6, marginTop:12, flexWrap:'wrap' }}>
                  <Btn onClick={()=>{ setForm({...e}); setEditing(e); setShowNew(true) }}><PencilSimple size={13} weight={PW} color={DM}/> Bearbeiten</Btn>
                  <Btn onClick={()=>{ updateWikiEntry(e.id,{verified:!e.verified}); reload() }}><SealCheck size={13} weight={PW} color={e.verified?DM:'#22C55E'}/>{e.verified?'Verifikation entfernen':'Verifizieren'}</Btn>
                  <IconBtn danger onClick={()=>{ if(confirm('Artikel löschen?')){deleteWikiEntry(e.id);reload()} }}><Trash size={14} weight={PW} color="#EF4444"/></IconBtn>
                </div>
              </div>
            )}
          </div>
        )
      })}
      {showNew && (
        <Modal title={editing?'Artikel bearbeiten':'Neuer Wiki-Artikel'} onClose={()=>{ setShowNew(false); setEditing(null) }}>
          <FInput label="Titel" required value={form.title} onChange={sf('title')} placeholder="Kurztitel des Problems"/>
          <FSel label="Kategorie" value={form.tag} onChange={sf('tag')} options={WIKI_TAGS.map(t=>[t,t])}/>
          <FInput label="Problem / Symptom" value={form.problem} onChange={sf('problem')} multiline placeholder="Was meldet der Benutzer?"/>
          <FInput label="Lösung" value={form.solution} onChange={sf('solution')} multiline placeholder="1. Schritt…"/>
          <Btn v="primary" onClick={()=>{ if(!form.title.trim()) return; if(editing) updateWikiEntry(editing.id,form); else createWikiEntry(form); reload(); setShowNew(false); setEditing(null) }} style={{ width:'100%', marginTop:4 }}>
            <Plus size={13} weight={PW} color="#fff"/> {editing?'Änderungen speichern':'Artikel erstellen'}
          </Btn>
        </Modal>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// KALENDER
// ════════════════════════════════════════════════════════════
function KalenderTab({ wartungen, reload }) {
  const [showNew,setShowNew]=useState(false), [editing,setEditing]=useState(null)
  const today=new Date().toISOString().slice(0,10)
  const sorted=[...wartungen].sort((a,b)=>new Date(a.date)-new Date(b.date))
  const upcoming=sorted.filter(w=>w.date>=today&&w.status!=='erledigt')
  const past=sorted.filter(w=>w.date<today||w.status==='erledigt').slice(0,10)

  function WartungForm({ initial={}, onSave }) {
    const [lf,setLf]=useState({ title:'',type:'Software-Update',date:today,time:'09:00',duration:'60',assignee:'',notes:'',status:'geplant',...initial })
    const ls=k=>v=>setLf(p=>({...p,[k]:v}))
    return (
      <div>
        <FInput label="Bezeichnung" required value={lf.title} onChange={ls('title')} placeholder="z.B. Windows Update"/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <FSel label="Typ" value={lf.type} onChange={ls('type')} options={WART_TYPES.map(t=>[t,t])}/>
          <FSel label="Status" value={lf.status} onChange={ls('status')} options={Object.entries(WART_STATUS).map(([k,v])=>[k,v.l])}/>
          <FInput label="Datum" type="date" value={lf.date} onChange={ls('date')}/>
          <FInput label="Uhrzeit" type="time" value={lf.time} onChange={ls('time')}/>
          <FInput label="Dauer (Min)" type="number" value={lf.duration} onChange={ls('duration')}/>
          <FInput label="Techniker" value={lf.assignee} onChange={ls('assignee')} placeholder="Name"/>
        </div>
        <FInput label="Notizen" value={lf.notes} onChange={ls('notes')} multiline/>
        <Btn v="primary" onClick={()=>{ if(!lf.title.trim()) return; onSave(lf) }} style={{ width:'100%' }}>
          <Plus size={13} weight={PW} color="#fff"/> {initial.id?'Änderungen speichern':'Wartung planen'}
        </Btn>
      </div>
    )
  }

  function WCard({ w }) {
    const s=WART_STATUS[w.status]||WART_STATUS.geplant, isToday=w.date===today, isPast=w.date<today
    return (
      <div style={{ background:isToday?'#0f1a0f':C, border:`1px solid ${isToday?A+'50':isPast?D2:BR}`, borderRadius:12, padding:'12px 13px', marginBottom:8 }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
          <div style={{ flexShrink:0, textAlign:'center', minWidth:38, background:C2, borderRadius:8, padding:'5px 6px', border:`1px solid ${isToday?A+'40':BR}` }}>
            <div style={{ fontSize:11, fontWeight:800, color:isToday?A:DM }}>{new Date(w.date+'T12:00').toLocaleDateString('de-DE',{day:'2-digit',month:'short'})}</div>
            <div style={{ fontSize:9, color:DM }}>{w.time}</div>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:TX }}>{w.title}</div>
            <div style={{ fontSize:10, color:DM, marginTop:2 }}>{w.type}{w.duration&&` · ${w.duration}min`}{w.assignee&&` · ${w.assignee}`}</div>
          </div>
          <Pill color={s.c} label={s.l} sm/>
        </div>
        {w.notes && <div style={{ fontSize:11, color:'#666', marginTop:7, paddingLeft:48, lineHeight:1.5 }}>{w.notes}</div>}
        <div style={{ display:'flex', gap:5, justifyContent:'flex-end', marginTop:8 }}>
          <IconBtn onClick={()=>setEditing(w)}><PencilSimple size={13} weight={PW} color={DM}/></IconBtn>
          {w.status!=='erledigt' && <Btn onClick={()=>{updateWartung(w.id,{status:'erledigt'});reload()}} style={{ background:'#0f1a0f', color:'#22C55E', border:'1px solid #22C55E30' }}><Checks size={13} weight={PW} color="#22C55E"/> Erledigt</Btn>}
          <IconBtn danger onClick={()=>{ if(confirm('Löschen?')){deleteWartung(w.id);reload()} }}><Trash size={13} weight={PW} color="#EF4444"/></IconBtn>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Btn v="primary" onClick={()=>setShowNew(true)} style={{ width:'100%', marginBottom:16 }}><Plus size={13} weight={PW} color="#fff"/> Wartung planen</Btn>
      {upcoming.length>0 && (<><div style={{ fontSize:9, fontWeight:700, color:DM, letterSpacing:'1.5px', marginBottom:8 }}>GEPLANT & ANSTEHEND</div>{upcoming.map(w=><WCard key={w.id} w={w}/>)}</>)}
      {past.length>0 && (<><div style={{ fontSize:9, fontWeight:700, color:D2, letterSpacing:'1.5px', marginBottom:8, marginTop:16 }}>VERGANGEN</div>{past.map(w=><WCard key={w.id} w={w}/>)}</>)}
      {wartungen.length===0 && <div style={{ background:C, borderRadius:12, padding:28, textAlign:'center', color:DM, fontSize:12 }}>Noch keine Wartungen</div>}
      {showNew && <Modal title="Wartung planen" onClose={()=>setShowNew(false)}><WartungForm onSave={f=>{createWartung(f);reload();setShowNew(false)}}/></Modal>}
      {editing && <Modal title="Wartung bearbeiten" onClose={()=>setEditing(null)}><WartungForm initial={editing} onSave={f=>{updateWartung(editing.id,f);reload();setEditing(null)}}/></Modal>}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// BERICHT
// ════════════════════════════════════════════════════════════
function BerichtTab({ tickets, devices, wiki, wartungen }) {
  const [generating,setGenerating]=useState(false), [mentorUrl,setMentorUrl]=useState(''), [copied,setCopied]=useState(false), [pushing,setPushing]=useState(false), [notes,setNotes]=useState('')
  const act=getTodayActivity(), today=new Date()
  const breached=tickets.filter(t=>getSLAStatus(t).state==='breached').length
  const token=getMentorToken()
  const baseUrl=`${window.location.origin}/#mentor=${token}`
  const genMentor=async()=>{
    setPushing(true)
    await pushMentorData()
    setMentorUrl(baseUrl)
    setPushing(false)
  }
  const copyUrl=()=>navigator.clipboard.writeText(mentorUrl).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2500) })
  const exportPDF=()=>{ setGenerating(true); setTimeout(()=>{ buildPDF(tickets,devices,wiki,wartungen,act,notes); setGenerating(false) },80) }
  const stats=[
    [`${act.openedToday.length} Tickets eröffnet`,'#F97316'],
    [`${act.resolvedToday.length} Tickets erledigt`,'#22C55E'],
    [`${act.inProgressToday.length} in Bearbeitung`,'#3B82F6'],
    [`${breached} SLA-Verletzungen`,'#EF4444'],
    [`${act.devicesAddedToday.length} Geräte erfasst`,'#A855F7'],
    [`${act.wikiAddedToday.length} Wiki-Einträge`,'#14B8A6'],
  ]
  return (
    <div>
      <div style={{ background:C, border:`1px solid ${BR}`, borderRadius:14, padding:'15px 16px', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
          <ClipboardText size={14} weight={PW} color={A}/>
          <span style={{ fontSize:10, fontWeight:800, color:A, letterSpacing:'2px' }}>SCHICHTBERICHT — {today.toLocaleDateString('de-DE',{weekday:'long',day:'2-digit',month:'long'}).toUpperCase()}</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
          {stats.map(([l,c])=><div key={l} style={{ background:C2, borderRadius:9, padding:'8px 10px', borderLeft:`3px solid ${c}` }}><div style={{ fontSize:11, fontWeight:700, color:TX }}>{l}</div></div>)}
        </div>
        <FInput label="Schichtnotizen / Übergabe" value={notes} onChange={setNotes} multiline placeholder="Wichtige Hinweise für die nächste Schicht..."/>
      </div>
      <div style={{ background:C, border:`1px solid ${BR}`, borderRadius:14, padding:'15px 16px', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}><FileText size={14} weight={PW} color={A}/><span style={{ fontSize:10, fontWeight:800, color:A, letterSpacing:'2px' }}>PDF SERVICEBERICHT</span></div>
        <div style={{ fontSize:11, color:DM, lineHeight:1.7, marginBottom:12 }}>Premium-Bericht mit Cover, KPI-Auswertung, allen Tickets (farbkodiert), Geräte-Inventar, Wartungsplan, Wissensdatenbank und BRANI+ Branding.</div>
        <button onClick={exportPDF} disabled={generating} style={{ width:'100%', padding:'14px', borderRadius:12, background:generating?C2:`linear-gradient(135deg,${A},${A2})`, border:'none', cursor:generating?'not-allowed':'pointer', color:'#fff', fontSize:13, fontWeight:800, letterSpacing:'0.8px', fontFamily:'inherit', boxShadow:generating?'none':`0 4px 20px ${A}35`, transition:'all .2s', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <FileText size={15} weight={PW} color="#fff"/>{generating?'Wird generiert…':`PDF exportieren — ${today.toISOString().slice(0,10)}`}
        </button>
      </div>
      <div style={{ background:C, border:`1px solid ${BR}`, borderRadius:14, padding:'15px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}><LinkSimple size={14} weight={PW} color={A}/><span style={{ fontSize:10, fontWeight:800, color:A, letterSpacing:'2px' }}>MENTOR-LINK</span></div>
        <div style={{ fontSize:11, color:DM, lineHeight:1.6, marginBottom:12 }}>Live-Dashboard für deinen Mentor. Daten werden bei jedem Push aktualisiert — kein Login nötig.</div>
        <div style={{ background:C2, border:`1px solid ${BR}`, borderRadius:10, padding:'10px 12px', fontSize:10, color:A, wordBreak:'break-all', marginBottom:10, lineHeight:1.6, fontFamily:'monospace' }}>{baseUrl}</div>
        {!mentorUrl ? (
          <Btn v="orange" onClick={genMentor} disabled={pushing} style={{ width:'100%' }}><LinkSimple size={13} weight={PW} color="#fff"/>{pushing?'Wird übertragen…':'Daten senden & Link aktivieren'}</Btn>
        ) : (
          <>
            <div style={{ display:'flex', gap:8 }}>
              <Btn onClick={copyUrl} v="primary" style={{ flex:1 }}><Checks size={13} weight={PW} color="#fff"/>{copied?'Kopiert!':'Link kopieren'}</Btn>
              <IconBtn onClick={genMentor}><ArrowClockwise size={14} weight={PW} color={DM}/></IconBtn>
            </div>
            <div style={{ fontSize:9, color:D2, marginTop:8, textAlign:'center' }}>Zuletzt gesendet: {today.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})} Uhr — Token: {token}</div>
          </>
        )}
      </div>
    </div>
  )
}

// ── PREMIUM PDF ───────────────────────────────────────────────────────────────
function buildPDF(tickets, devices, wiki, wartungen, activity, notes) {
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' })
  const W=210, H=297, ML=14, MR=196, CW=182
  const now = new Date()
  const ds = now.toLocaleDateString('de-DE',{day:'2-digit',month:'long',year:'numeric'})
  const dsShort = now.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'})
  const ts = now.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})
  const dayName = now.toLocaleDateString('de-DE',{weekday:'long'})

  const OG=[249,115,22], OGD=[180,75,10]
  const WH=[255,255,255], DK=[22,22,22], MD=[80,80,80]
  const LG=[245,245,245], MG=[150,150,150]
  const GR=[34,197,94], BL=[59,130,246], RD=[239,68,68], PR=[168,85,247]
  const PRIO_BG={ niedrig:[240,255,242], mittel:[255,249,240], hoch:[255,240,240], kritisch:[255,232,232] }
  const STATUS_CLR={ open:OG, in_progress:BL, done:GR, escalated:RD, waiting:PR }
  const DEV_CLR={ aktiv:GR, defekt:RD, in_reparatur:OG, ausgemustert:MD }
  const WART_CLR={ geplant:BL, in_progress:OG, erledigt:GR, verschoben:PR, abgebrochen:RD }

  let y=0

  function newPage() {
    doc.addPage()
    doc.setFillColor(20,20,20); doc.rect(0,0,W,9,'F')
    doc.setFillColor(...OG); doc.rect(0,0,4,9,'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(6); doc.setTextColor(...MG)
    doc.text('DT GmbH — IT Servicebericht', ML+2, 5.8)
    doc.text(dsShort, MR, 5.8, {align:'right'})
    y=15
  }

  function checkPage(n) { if(y+n>H-15) newPage() }

  function secHead(title, clr=OG) {
    checkPage(15)
    doc.setFillColor(...clr); doc.rect(ML,y,CW,9,'F')
    doc.setFillColor(...WH); doc.rect(ML,y,4,9,'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...WH)
    doc.text(title, ML+9, y+6.2)
    y+=12
  }

  function tHead(cols) {
    doc.setFillColor(28,28,28); doc.rect(ML,y,CW,7,'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...LG)
    let cx=ML+2; cols.forEach(([l,w])=>{ doc.text(String(l).toUpperCase(),cx,y+4.8); cx+=w }); y+=7
  }

  function tRow(cols, data, ri, rowBg=null, colClrs=null) {
    checkPage(8)
    const bg=rowBg||(ri%2===0?[248,248,248]:[255,255,255])
    doc.setFillColor(...bg); doc.rect(ML,y,CW,7.5,'F')
    doc.setFont('helvetica','normal'); doc.setFontSize(7)
    let cx=ML+2
    cols.forEach(([,w],i)=>{
      const v=String(data[i]??'—')
      const mc=Math.floor(w/1.85)
      const txt=v.length>mc?v.slice(0,mc-1)+'…':v
      const clr=colClrs&&colClrs[i]?colClrs[i]:DK
      doc.setTextColor(...clr); doc.text(txt,cx,y+5.2)
      cx+=w
    })
    y+=7.5
  }

  // ── COVER PAGE ─────────────────────────────────────────────────────────────
  // Orange header
  doc.setFillColor(...OG); doc.rect(0,0,W,40,'F')
  doc.setFillColor(...OGD); doc.rect(0,32,W,8,'F')

  doc.setFont('helvetica','bold'); doc.setFontSize(26); doc.setTextColor(...WH)
  doc.text('Dans-Tech GmbH', ML, 18)
  doc.setFont('helvetica','normal'); doc.setFontSize(9)
  doc.text('IT Service Management · Klinikum München', ML, 27)

  doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...WH)
  doc.text('IT SERVICEBERICHT', MR, 12, {align:'right'})
  doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor([255,220,180])
  doc.text('Branislav Ćirić · BRANI+', MR, 19, {align:'right'})
  doc.text(`${dayName}, ${ds}`, MR, 26, {align:'right'})
  doc.text(`${ts} Uhr`, MR, 33, {align:'right'})

  doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...WH)
  doc.text('IT INFRASTRUKTUR · SUPPORT · DOKUMENTATION · SLA-MONITORING', W/2, 37.5, {align:'center'})

  y=50

  // KPI boxes — 6 in two rows
  const open=tickets.filter(t=>t.status==='open').length
  const inP=tickets.filter(t=>t.status==='in_progress').length
  const done=tickets.filter(t=>t.status==='done').length
  const breach=tickets.filter(t=>getSLAStatus(t).state==='breached').length
  const warn=tickets.filter(t=>getSLAStatus(t).state==='warning').length
  const crit=tickets.filter(t=>t.priority==='kritisch'&&t.status!=='done').length

  const kpis=[['Offen',open,OG],['Aktiv',inP,BL],['Erledigt',done,GR],['SLA Breach',breach,RD],['SLA Warn',warn,[245,158,11]],['Kritisch',crit,[220,38,38]]]
  const kw=(CW-10)/3
  kpis.forEach(([l,v,c],i)=>{
    const col=i%3, row=Math.floor(i/3)
    const bx=ML+col*(kw+5), by=y+row*26
    doc.setFillColor(248,248,248); doc.roundedRect(bx,by,kw,22,2,2,'F')
    doc.setFillColor(...c); doc.rect(bx,by,kw,3,'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(17); doc.setTextColor(...c)
    doc.text(String(v),bx+kw/2,by+14,{align:'center'})
    doc.setFontSize(5.5); doc.setFont('helvetica','normal'); doc.setTextColor(...MD)
    doc.text(l,bx+kw/2,by+19.5,{align:'center'})
  })
  y+=58

  // Summary row
  const sums=[['Geräte',devices.length,PR],['Wiki-Artikel',wiki.length,[20,184,166]],['Wartungen',wartungen.length,[245,158,11]]]
  const sw=(CW-4)/3
  sums.forEach(([l,v,c],i)=>{
    const bx=ML+i*(sw+2)
    doc.setFillColor(240,240,240); doc.roundedRect(bx,y,sw,14,2,2,'F')
    doc.setFillColor(...c); doc.rect(bx,y,sw,2.5,'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(...c)
    doc.text(String(v),bx+sw/2,y+9,{align:'center'})
    doc.setFontSize(5.5); doc.setFont('helvetica','normal'); doc.setTextColor(...MD)
    doc.text(l,bx+sw/2,y+13,{align:'center'})
  })
  y+=22

  if(notes&&notes.trim()){
    const lines=doc.splitTextToSize(notes.trim(),CW-10)
    const bh=10+lines.length*4.2
    doc.setFillColor(255,248,240); doc.roundedRect(ML,y,CW,bh,3,3,'F')
    doc.setFillColor(...OG); doc.rect(ML,y,4,bh,'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...OG)
    doc.text('SCHICHTNOTIZEN / ÜBERGABE', ML+8, y+5.5)
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(80,60,20)
    lines.forEach((l,i)=>doc.text(l,ML+8,y+10.5+i*4.2))
    y+=bh+8
  }

  // ── TICKETS ────────────────────────────────────────────────────────────────
  newPage()
  secHead(`TICKET-ÜBERSICHT (${tickets.length} Tickets)`)

  const tCols=[['Nr',16],['Kat.',20],['Titel',46],['Prio',18],['Status',24],['SLA',18],['Gerät',16],['Melder',18],['Erstellt',16]]
  tHead(tCols)

  tickets.forEach((t,i)=>{
    const sla=getSLAStatus(t)
    const dev=devices.find(d=>d.id===t.deviceId)
    const slaText=sla.state==='breached'?'VERLETZT':sla.state==='met'||sla.state==='ok'?'OK':'WARNUNG'
    const slaClr=sla.state==='breached'?RD:sla.state==='warning'?[245,158,11]:GR
    const statClr=STATUS_CLR[t.status]||OG
    tRow(tCols,
      [t.number,t.kategorie||'—',t.title,PRIO[t.priority]?.l||'—',STATUS[t.status]?.l||'—',slaText,dev?dev.rNumber:'—',t.melder||'—',fmt(t.createdAt)],
      i, PRIO_BG[t.priority]||null,
      {3:null,4:statClr,5:slaClr}
    )
  })
  if(!tickets.length){doc.setFillColor(245,245,245);doc.rect(ML,y,CW,10,'F');doc.setFont('helvetica','italic');doc.setFontSize(8);doc.setTextColor(...MG);doc.text('Keine Tickets vorhanden',ML+CW/2,y+6.5,{align:'center'});y+=12}
  y+=6

  // Open ticket details
  const openTickets=tickets.filter(t=>t.status!=='done'&&(t.desc||t.resolution))
  if(openTickets.length){
    checkPage(20)
    secHead('OFFENE TICKETS — DETAILANSICHT', BL)
    openTickets.slice(0,12).forEach(t=>{
      const p=PRIO[t.priority], pClr=p?.c==='#22C55E'?GR:p?.c==='#EF4444'?RD:p?.c==='#DC2626'?[220,38,38]:OG
      checkPage(28)
      doc.setFillColor(25,25,25); doc.rect(ML,y,CW,10,'F')
      doc.setFillColor(...pClr); doc.rect(ML,y,4,10,'F')
      doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...WH)
      const ttl=t.title.length>55?t.title.slice(0,54)+'…':t.title
      doc.text(`${t.number} — ${ttl}`, ML+8, y+6.5)
      doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...MG)
      const meta=[PRIO[t.priority]?.l,STATUS[t.status]?.l,t.assignee,fmtT(t.createdAt)].filter(Boolean).join(' · ')
      doc.text(meta, MR, y+6.5, {align:'right'})
      y+=12
      if(t.desc){
        const dl=doc.splitTextToSize(t.desc.slice(0,400),CW-8)
        const dh=6+Math.min(dl.length,5)*4.2
        doc.setFillColor(250,250,250); doc.rect(ML,y,CW,dh,'F')
        doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(60,60,60)
        dl.slice(0,5).forEach((l,i)=>{checkPage(5);doc.text(l,ML+4,y+4.5+i*4.2)})
        y+=dh+2
      }
      if(t.resolution){
        const rl=doc.splitTextToSize(t.resolution.slice(0,300),CW-8)
        const rh=6+Math.min(rl.length,4)*4.2
        doc.setFillColor(240,255,244); doc.rect(ML,y,CW,rh,'F')
        doc.setFillColor(...GR); doc.rect(ML,y,3,rh,'F')
        doc.setFont('helvetica','bold'); doc.setFontSize(6); doc.setTextColor(...GR)
        doc.text('LÖSUNG', ML+6, y+4)
        doc.setFont('helvetica','normal'); doc.setTextColor(20,60,20)
        rl.slice(0,4).forEach((l,i)=>doc.text(l,ML+6,y+4.5+(i+1)*4.2))
        y+=rh+2
      }
      y+=4
    })
    y+=4
  }

  // ── DEVICES ────────────────────────────────────────────────────────────────
  newPage()
  secHead(`GERÄTE-INVENTAR (${devices.length} Geräte)`, PR)

  const dCols=[['R-Nr',16],['Name',26],['Typ',20],['Modell',28],['Benutzer',22],['Standort',18],['IP',22],['OS',20],['Status',16],['']]
  const dColsDef=[['R-Nr',16],['Name',26],['Typ',20],['Modell',28],['Benutzer',22],['Standort',18],['IP',22],['OS',20],['Status',16]]
  tHead(dColsDef)
  devices.forEach((d,i)=>{
    const sc=DEV_CLR[d.status]||MD
    tRow(dColsDef,[d.rNumber,d.name||'—',d.type,d.model||'—',d.userName||'—',d.location||'—',d.ipAddress||'—',d.os||'—',DEV_STATUS[d.status]?.l||d.status],i,null,{8:sc})
  })
  if(!devices.length){doc.setFillColor(245,245,245);doc.rect(ML,y,CW,10,'F');doc.setFont('helvetica','italic');doc.setFontSize(8);doc.setTextColor(...MG);doc.text('Keine Geräte erfasst',ML+CW/2,y+6.5,{align:'center'});y+=12}
  y+=6

  // ── WARTUNGEN ──────────────────────────────────────────────────────────────
  if(wartungen.length){
    checkPage(30)
    if(y>220) newPage()
    secHead(`WARTUNGSPLAN (${wartungen.length} Termine)`,[20,184,166])
    const wCols=[['Datum',20],['Zeit',12],['Bezeichnung',52],['Typ',24],['Techniker',22],['Dauer',14],['Status',24],['']]
    const wColsDef=[['Datum',20],['Zeit',12],['Bezeichnung',52],['Typ',24],['Techniker',22],['Dauer',14],['Status',24]]
    tHead(wColsDef)
    const today=now.toISOString().slice(0,10)
    ;[...wartungen].sort((a,b)=>new Date(a.date)-new Date(b.date)).forEach((w,i)=>{
      const isPast=w.date<today, isToday=w.date===today
      const rowBg=isToday?[255,251,235]:isPast?[248,248,248]:null
      const sc=WART_CLR[w.status]||BL
      tRow(wColsDef,[
        new Date(w.date+'T12:00').toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'2-digit'}),
        w.time||'—',w.title,w.type||'—',w.assignee||'—',w.duration?`${w.duration}m`:'—',WART_STATUS[w.status]?.l||w.status
      ],i,rowBg,{6:sc})
    })
    y+=6
  }

  // ── WIKI ───────────────────────────────────────────────────────────────────
  if(wiki.length){
    checkPage(30)
    if(y>220) newPage()
    secHead(`WISSENSDATENBANK (${wiki.length} Artikel)`,[20,184,166])
    const wkCols=[['Titel',66],['Kategorie',28],['Verwendet',20],['Verifiziert',20],['Erstellt',48]]
    tHead(wkCols)
    wiki.slice(0,20).forEach((e,i)=>tRow(wkCols,[e.title,e.tag,String(e.hits||0),e.verified?'✓ Ja':'Nein',fmt(e.createdAt)],i,null,{3:e.verified?GR:MD}))
    y+=6
  }

  // ── FOOTER on all pages ────────────────────────────────────────────────────
  const pgs=doc.getNumberOfPages()
  for(let i=1;i<=pgs;i++){
    doc.setPage(i)
    doc.setFillColor(20,20,20); doc.rect(0,H-13,W,13,'F')
    doc.setFillColor(...OG); doc.rect(0,H-13,4,13,'F')
    doc.setFillColor(40,40,40); doc.rect(0,H-13,W,1,'F')
    doc.setFont('helvetica','normal'); doc.setFontSize(6); doc.setTextColor(...MG)
    doc.text('BRANI+ · Branislav Ćirić · Dans-Tech GmbH · Klinikum München', ML+2, H-6)
    doc.text(`Seite ${i} von ${pgs}`, MR, H-6, {align:'right'})
    doc.setFont('helvetica','bold'); doc.setTextColor(...OG)
    doc.text(`DT GmbH · IT Servicebericht · ${dsShort}`, W/2, H-6, {align:'center'})
    doc.setFont('helvetica','normal'); doc.setFontSize(5.5); doc.setTextColor(80,80,80)
    doc.text('Vertraulich — Nur für interne Verwendung', W/2, H-2, {align:'center'})
  }

  doc.save(`DT-GmbH-Servicebericht-${now.toISOString().slice(0,10)}.pdf`)
}

// ── MENTOR VIEW ───────────────────────────────────────────────────────────────
export function MentorView({ token }) {
  const [snap, setSnap] = useState(null)
  const [err, setErr] = useState(false)
  const [lastAt, setLastAt] = useState(null)

  useEffect(() => {
    if (!token) { setErr(true); return }

    async function fetch() {
      const { data, error } = await supabase
        .from('mentor_data').select('*').eq('token', token).single()
      if (error || !data) { setErr(true); return }
      setSnap(data); setLastAt(data.updated_at)
    }
    fetch()

    const ch = supabase.channel('mentor_' + token)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mentor_data', filter: `token=eq.${token}` },
        payload => { setSnap(payload.new); setLastAt(payload.new.updated_at) })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [token])

  if (err) return (
    <div style={{ minHeight:'100dvh', background:BG, color:'#EF4444', fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, padding:32, textAlign:'center' }}>
      <ShieldWarning size={48} weight={PW} color="#EF4444"/>
      <div style={{ fontSize:15, fontWeight:800, color:TX }}>Link ungültig oder abgelaufen</div>
      <div style={{ fontSize:12, color:DM }}>Bitte neuen Link vom BRANI+ System anfordern.</div>
    </div>
  )

  if (!snap) return (
    <div style={{ minHeight:'100dvh', background:BG, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <ArrowClockwise size={32} weight={PW} color={A} style={{ animation:'spin 1s linear infinite' }}/>
        <div style={{ fontSize:12, color:DM, marginTop:12 }}>Lade Daten…</div>
      </div>
    </div>
  )

  const tickets = snap.tickets || []
  const devices = snap.devices || []
  const wiki    = snap.wiki    || []
  const open    = tickets.filter(t=>t.status==='open').length
  const inProg  = tickets.filter(t=>t.status==='in_progress').length
  const done    = tickets.filter(t=>t.status==='done').length

  return (
    <div style={{ minHeight:'100dvh', background:BG, color:TX, fontFamily:'Inter,sans-serif', padding:16 }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ maxWidth:640, margin:'0 auto', paddingBottom:40 }}>
        <div style={{ background:`linear-gradient(135deg,${A},${A2})`, borderRadius:16, padding:'18px 20px', marginBottom:18 }}>
          <div style={{ fontSize:18, fontWeight:900, color:'#fff' }}>DT GmbH</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.75)' }}>MENTOR-ÜBERSICHT — Live</div>
          {lastAt && <div style={{ fontSize:9, color:'rgba(255,255,255,0.55)', marginTop:4 }}>Zuletzt aktualisiert: {new Date(lastAt).toLocaleString('de-DE')} · Branislav Ćirić</div>}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
          {[['Gesamt',tickets.length,TX],['Offen',open,A],['Aktiv',inProg,'#3B82F6'],['Erledigt',done,'#22C55E']].map(([l,v,c])=>(
            <div key={l} style={{ background:C, border:`1px solid ${BR}`, borderRadius:12, padding:'10px 8px', textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:900, color:c }}>{v}</div>
              <div style={{ fontSize:8, color:DM, marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>

        {tickets.length > 0 && <>
          <div style={{ fontSize:9, fontWeight:700, color:DM, letterSpacing:'1.5px', marginBottom:8 }}>TICKETS ({tickets.length})</div>
          {tickets.map((t,i)=>(
            <div key={i} style={{ background:C, border:`1px solid ${BR}`, borderRadius:11, padding:'10px 12px', marginBottom:6, display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ fontSize:9, fontWeight:800, color:A, flexShrink:0 }}>{t.number}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:700, color:TX }}>{t.title}</div>
                {t.desc && <div style={{ fontSize:10, color:DM, marginTop:2, lineHeight:1.4 }}>{t.desc}</div>}
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                <Pill color={STATUS[t.status]?.c||A} label={STATUS[t.status]?.l||t.status} sm/>
                <Pill color={PRIO[t.priority]?.c||DM} label={PRIO[t.priority]?.l||t.priority} sm/>
              </div>
            </div>
          ))}
        </>}

        {devices.length > 0 && <>
          <div style={{ fontSize:9, fontWeight:700, color:DM, letterSpacing:'1.5px', marginBottom:8, marginTop:20 }}>GERÄTE ({devices.length})</div>
          {devices.map((d,i)=>(
            <div key={i} style={{ background:C, border:`1px solid ${BR}`, borderRadius:11, padding:'8px 12px', marginBottom:6, display:'flex', gap:8, alignItems:'center' }}>
              <div style={{ width:30, height:30, borderRadius:7, background:`${A}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><DevTypeIcon type={d.type} size={14} color={A}/></div>
              <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:700, color:TX }}>{d.name||d.type}</div><div style={{ fontSize:10, color:DM }}>{d.userName||''}{d.location?` · ${d.location}`:''}</div></div>
              <Pill color={DEV_STATUS[d.status]?.c||A} label={DEV_STATUS[d.status]?.l||d.status} sm/>
            </div>
          ))}
        </>}

        {wiki.length > 0 && <>
          <div style={{ fontSize:9, fontWeight:700, color:DM, letterSpacing:'1.5px', marginBottom:8, marginTop:20 }}>WISSENSDATENBANK ({wiki.length})</div>
          {wiki.map((e,i)=>(
            <div key={i} style={{ background:C, border:`1px solid ${BR}`, borderRadius:11, padding:'8px 12px', marginBottom:6, display:'flex', gap:8, alignItems:'center' }}>
              <WikiTagIcon tag={e.tag} size={14} color={TAG_COLOR[e.tag]||DM}/>
              <div style={{ flex:1, fontSize:12, fontWeight:700, color:TX }}>{e.title}</div>
              {e.verified && <SealCheck size={14} weight={PW} color="#22C55E"/>}
            </div>
          ))}
        </>}
      </div>
    </div>
  )
}

// ── Tabs config ───────────────────────────────────────────────────────────────
const TABS = [
  { id:'dashboard', l:'Dashboard', Icon:SquaresFour  },
  { id:'tickets',   l:'Tickets',   Icon:ClipboardText },
  { id:'devices',   l:'Geräte',    Icon:Desktop       },
  { id:'wiki',      l:'Wissen',    Icon:BookOpen      },
  { id:'kalender',  l:'Kalender',  Icon:CalendarBlank },
  { id:'bericht',   l:'Bericht',   Icon:FileText      },
]

// ── SidebarNav items for desktop ──────────────────────────────────────────────
export const DT_SIDEBAR_TABS = TABS

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DTGmbHScreen() {
  const [tab,setTab]       = useState('dashboard')
  const [tickets,setTickets] = useState(loadTickets)
  const [devices,setDevices] = useState(loadDevices)
  const [wiki,setWiki]     = useState(loadWiki)
  const [wartungen,setWartungen] = useState(loadWartungen)
  const [,tick] = useState(0)
  useEffect(()=>{ const t=setInterval(()=>tick(n=>n+1),60000); return ()=>clearInterval(t) },[])

  function reload() { setTickets(loadTickets()); setDevices(loadDevices()); setWiki(loadWiki()); setWartungen(loadWartungen()) }

  const openCount   = tickets.filter(t=>t.status!=='done').length
  const slaBreached = tickets.filter(t=>getSLAStatus(t).state==='breached').length
  const activeDevs  = devices.filter(d=>d.status==='aktiv').length

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:BG, color:TX, fontFamily:'Inter,sans-serif', overflow:'hidden' }}>

      {/* ── Header ── */}
      <div style={{ flexShrink:0, background:C, borderBottom:`1px solid ${BR}`, paddingTop:'env(safe-area-inset-top,0px)' }}>
        <div style={{ padding:'12px 15px 0', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:9, flexShrink:0, background:`linear-gradient(135deg,${A},${A2})`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <HardDrive size={18} weight={PW} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:900, color:TX, lineHeight:1.1 }}>Dans-Tech GmbH</div>
            <div style={{ fontSize:7, color:DM, letterSpacing:'1px', fontWeight:600 }}>ITSM · L1/L2 SUPPORT · KLINIKUM MÜNCHEN</div>
          </div>
          <div style={{ display:'flex', gap:5 }}>
            {slaBreached>0 && (
              <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:9, background:'#EF444418', color:'#EF4444', border:'1px solid #EF444430', borderRadius:7, padding:'3px 7px', fontWeight:800 }}>
                <ShieldWarning size={10} weight={PW} color="#EF4444"/> {slaBreached}
              </div>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:9, background:`${A}18`, color:A, border:`1px solid ${A}30`, borderRadius:7, padding:'3px 7px', fontWeight:700 }}>
              <ClipboardText size={10} weight={PW} color={A}/> {openCount}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:9, background:'#22C55E18', color:'#22C55E', border:'1px solid #22C55E30', borderRadius:7, padding:'3px 7px', fontWeight:700 }}>
              <Desktop size={10} weight={PW} color="#22C55E"/> {activeDevs}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ position:'relative' }}>
          <div style={{ display:'flex', overflowX:'auto', scrollbarWidth:'none', WebkitOverflowScrolling:'touch' }}>
            {TABS.map(t=>{
              const active=tab===t.id
              return (
                <button key={t.id} onClick={()=>setTab(t.id)} style={{ flexShrink:0, padding:'10px 12px', border:'none', cursor:'pointer', background:active?`${A}10`:'transparent', fontFamily:'inherit', color:active?A:DM, borderBottom:`2px solid ${active?A:'transparent'}`, transition:'all .15s', display:'flex', flexDirection:'column', alignItems:'center', gap:3, minWidth:56 }}>
                  <t.Icon size={18} weight={PW} color={active?A:DM}/>
                  <span style={{ fontSize:8, fontWeight:active?800:600, letterSpacing:'0.2px', whiteSpace:'nowrap' }}>{t.l}</span>
                </button>
              )
            })}
          </div>
          <div style={{ position:'absolute', right:0, top:0, bottom:0, width:28, background:`linear-gradient(to left,${C},transparent)`, pointerEvents:'none' }}/>
          <div style={{ position:'absolute', left:0, top:0, bottom:0, width:12, background:`linear-gradient(to right,${C},transparent)`, pointerEvents:'none' }}/>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch' }}>
        <div style={{ padding:'15px 13px calc(env(safe-area-inset-bottom,0px) + 96px)' }}>
          {tab==='dashboard' && <DashboardTab tickets={tickets} devices={devices} onTab={setTab}/>}
          {tab==='tickets'   && <TicketsTab   tickets={tickets} devices={devices} reload={reload}/>}
          {tab==='devices'   && <DevicesTab   devices={devices} reload={reload}/>}
          {tab==='wiki'      && <WikiTab      wiki={wiki} reload={reload}/>}
          {tab==='kalender'  && <KalenderTab  wartungen={wartungen} reload={reload}/>}
          {tab==='bericht'   && <BerichtTab   tickets={tickets} devices={devices} wiki={wiki} wartungen={wartungen}/>}
        </div>
      </div>
    </div>
  )
}
