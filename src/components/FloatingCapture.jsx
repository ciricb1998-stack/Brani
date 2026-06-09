import { useState, useRef } from 'react'
import { loadCaptures, saveCaptures } from '../utils/storage.js'
import { useApp } from '../App.jsx'
import { BRANDS } from '../data/brands.js'

const R = 22; const CX = 32; const CY = 32; const SIZE = 64
const LAT = [-17,-11,-5,1,7,13,19].map(dy => {
  const rx = Math.sqrt(Math.max(0, R*R-(dy-1)*(dy-1)))
  return { cy: CY+dy, rx, ry: Math.max(0.6, rx*0.13) }
})
const LON = [
  {rx:4,ry:R},{rx:11,ry:R},{rx:18,ry:R},{rx:R,ry:R},
  {rx:4,ry:R,rot:55},{rx:11,ry:R,rot:55},
]
const PARTICLES = [
  [32,7],[52,17],[58,33],[50,51],[33,60],[14,55],
  [5,37],[6,18],[18,6],[54,48],[60,25],[10,47],[44,3],[3,30],[38,61],
]

export default function FloatingCapture({ isDesktop }) {
  const { settings } = useApp()
  const accent = (BRANDS[settings.brand] || BRANDS.brani).primary
  const [state, setState] = useState('idle') // idle | recording | saved
  const recRef = useRef(null)

  function startCapture() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    setState('recording')
    const rec = new SR()
    recRef.current = rec
    rec.lang = { bs: 'hr-HR', de: 'de-DE', en: 'en-US' }[settings.lang] || 'hr-HR'
    rec.continuous = true; rec.interimResults = false
    let captured = ''
    rec.onresult = e => { captured = Array.from(e.results).map(r => r[0].transcript).join(' ') }
    rec.onend = () => {
      if (captured.trim()) {
        const all = loadCaptures()
        saveCaptures([{ id: Date.now().toString(), text: '🎤 ' + captured.trim(), tag: 'ideja', createdAt: new Date().toISOString() }, ...all])
        setState('saved')
        setTimeout(() => setState('idle'), 2000)
      } else setState('idle')
    }
    rec.onerror = () => setState('idle')
    rec.start()
  }

  function onTap() {
    if (state === 'idle') startCapture()
    else if (state === 'recording') recRef.current?.stop()
  }

  const c = accent
  const isRec = state === 'recording'
  const isSaved = state === 'saved'
  const glowColor = isRec ? '#ef4444' : c

  return (
    <>
      <style>{`
        @keyframes fcOrbit1 { from{transform:rotateX(72deg) rotateZ(0deg)} to{transform:rotateX(72deg) rotateZ(360deg)} }
        @keyframes fcOrbit2 { from{transform:rotateX(65deg) rotateZ(120deg)} to{transform:rotateX(65deg) rotateZ(480deg)} }
        @keyframes fcGlow   { 0%,100%{opacity:.35;transform:scale(1)} 50%{opacity:.6;transform:scale(1.12)} }
        @keyframes fcGlowR  { 0%,100%{opacity:.55;transform:scale(1)} 50%{opacity:1;transform:scale(1.18)} }
        @keyframes fcScan   { 0%{transform:translateY(-${R}px);opacity:0} 10%{opacity:1} 90%{opacity:.8} 100%{transform:translateY(${R}px);opacity:0} }
        @keyframes fcTwink  { 0%,100%{opacity:.15} 50%{opacity:.8} }
        @keyframes fcDash   { from{stroke-dashoffset:0} to{stroke-dashoffset:-160} }
        @keyframes fcCheck  { from{opacity:0;transform:scale(.3)} 70%{transform:scale(1.2)} to{opacity:1;transform:scale(1)} }
        @keyframes fcWave   { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
        @keyframes fcPop    { from{opacity:0;transform:translateX(10px) translateY(-50%)} to{opacity:1;transform:translateX(0) translateY(-50%)} }
        @keyframes fcRecDot { 0%,100%{opacity:.5} 50%{opacity:1} }
      `}</style>

      <div
        onClick={onTap}
        style={{
          position: 'fixed',
          right: isDesktop ? 24 : 14,
          bottom: isDesktop ? 24 : 'calc(72px + env(safe-area-inset-bottom,0px) + 14px)',
          zIndex: 820, width: SIZE, height: SIZE,
          cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* Atmospheric glow */}
        <div style={{
          position: 'absolute', top: SIZE/2, left: SIZE/2,
          width: SIZE*2, height: SIZE*2, marginTop: -SIZE, marginLeft: -SIZE,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${glowColor}26 0%, ${glowColor}08 45%, transparent 68%)`,
          animation: isRec ? 'fcGlowR .9s ease-in-out infinite' : 'fcGlow 3.5s ease-in-out infinite',
          pointerEvents: 'none', transition: 'background 0.4s',
        }}/>

        {/* Orbit ring 1 */}
        <div style={{ position:'absolute', top:SIZE/2, left:SIZE/2, width:0, height:0, perspective:'260px', pointerEvents:'none' }}>
          <div style={{
            position:'absolute', width:SIZE+22, height:SIZE+22,
            marginTop:-(SIZE+22)/2, marginLeft:-(SIZE+22)/2,
            borderRadius:'50%', border:`1px solid ${glowColor}`,
            opacity: isRec ? .9 : .42,
            boxShadow:`0 0 7px ${glowColor}44`,
            animation:`fcOrbit1 ${isRec ? '1.1s' : '5s'} linear infinite`,
            transition:'opacity .3s, border-color .3s',
          }}/>
        </div>

        {/* Orbit ring 2 */}
        <div style={{ position:'absolute', top:SIZE/2, left:SIZE/2, width:0, height:0, perspective:'220px', pointerEvents:'none' }}>
          <div style={{
            position:'absolute', width:SIZE+36, height:SIZE+36,
            marginTop:-(SIZE+36)/2, marginLeft:-(SIZE+36)/2,
            borderRadius:'50%', border:`0.6px dashed ${c}44`, opacity:.18,
            animation:'fcOrbit2 9s linear infinite',
          }}/>
        </div>

        {/* Globe SVG */}
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ display:'block' }}>
          <defs>
            <radialGradient id={`sg${c.slice(1)}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={c} stopOpacity="0.17"/>
              <stop offset="100%" stopColor={c} stopOpacity="0"/>
            </radialGradient>
            <radialGradient id={`sl${c.slice(1)}`} cx="32%" cy="28%" r="55%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.11"/>
              <stop offset="100%" stopColor="#fff" stopOpacity="0"/>
            </radialGradient>
            <clipPath id="sc"><circle cx={CX} cy={CY} r={R}/></clipPath>
            <filter id="gf1"><feGaussianBlur stdDeviation="0.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="gf2"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          <circle cx={CX} cy={CY} r={R+8} fill={`url(#sg${c.slice(1)})`}/>
          <g clipPath="url(#sc)">
            {LON.map(({rx,ry,rot},i) => (
              <ellipse key={i} cx={CX} cy={CY} rx={rx} ry={ry} fill="none" stroke={c} strokeWidth="0.35" strokeOpacity="0.45" strokeDasharray="3 4" transform={rot?`rotate(${rot} ${CX} ${CY})`:undefined} style={{animation:`fcDash ${7+i*1.5}s linear infinite`}}/>
            ))}
          </g>
          <g clipPath="url(#sc)">
            {LAT.map(({cy:ly,rx,ry},i) => (
              <ellipse key={i} cx={CX} cy={ly} rx={rx} ry={ry} fill="none" stroke={c} strokeWidth="0.35" strokeOpacity={i===3?0.7:0.4}/>
            ))}
          </g>
          <line x1={CX-R} y1={CY+1} x2={CX+R} y2={CY+1} stroke={c} strokeWidth="0.7" strokeOpacity="0.75" clipPath="url(#sc)" filter="url(#gf1)"/>
          {!isSaved && (
            <line x1={CX-R} y1={CY} x2={CX+R} y2={CY} stroke={isRec?'#ef4444':c} strokeWidth="1.4" strokeOpacity="0.9" clipPath="url(#sc)" filter="url(#gf2)" style={{animation:`fcScan ${isRec?'1s':'2.5s'} ease-in-out infinite`}}/>
          )}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke={c} strokeWidth="1" strokeOpacity="0.9" filter="url(#gf1)"/>
          <circle cx={CX} cy={CY} r={R+0.5} fill="none" stroke={c} strokeWidth="2.5" strokeOpacity="0.13"/>
          <circle cx={CX} cy={CY} r={R} fill={`url(#sl${c.slice(1)})`}/>
          {PARTICLES.map(([px,py],i) => (
            <circle key={i} cx={px} cy={py} r={i%3===0?.9:.6} fill={c} style={{animation:`fcTwink ${1.2+(i*.27)%1.8}s ease-in-out infinite`,animationDelay:`${(i*.18)%1.5}s`}}/>
          ))}
          <ellipse cx={CX} cy={CY+R-2} rx={17} ry={4} fill="none" stroke={c} strokeWidth="0.65" strokeOpacity="0.5" filter="url(#gf1)"/>
          <ellipse cx={CX} cy={CY+R+2} rx={11} ry={2.5} fill="none" stroke={c} strokeWidth="0.5" strokeOpacity="0.35"/>
          <ellipse cx={CX} cy={CY+R+5} rx={6} ry={1.5} fill="none" stroke={c} strokeWidth="0.4" strokeOpacity="0.2"/>
          {isRec && <circle cx={CX} cy={CY} r="3.5" fill="#ef4444" style={{animation:'fcRecDot .8s ease-in-out infinite'}}/>}
          {isSaved && <text x={CX} y={CY+7} textAnchor="middle" fontSize="18" fill="white" fontWeight="900" style={{animation:'fcCheck 0.45s cubic-bezier(0.34,1.56,0.64,1) both'}}>✓</text>}
        </svg>

        {/* Recording waveform indicator */}
        {isRec && (
          <div style={{
            position:'absolute', right:SIZE+10, top:'50%',
            display:'flex', alignItems:'center', gap:5,
            background:'#080808', border:'1px solid #1a1a1a',
            borderLeft:'2px solid #ef4444', borderRadius:10, padding:'6px 10px',
            pointerEvents:'none', animation:'fcPop 0.18s ease both',
          }}>
            {[.4,1,.65,.9,.5,.8,.35].map((h,i) => (
              <div key={i} style={{ width:2.5, height:14, borderRadius:2, background:'#ef4444', transformOrigin:'bottom', animation:`fcWave ${.45+i*.07}s ease-in-out infinite`, animationDelay:`${i*.06}s` }}/>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
