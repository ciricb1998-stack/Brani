import { useState, useRef } from 'react'
import { useApp } from '../App.jsx'
import { loadVocab, saveVocab } from '../utils/storage.js'
import { Plus, BookOpen } from '@phosphor-icons/react'

const STATUS = {
  nova:  { label: 'Nova',  color: '#64748B', bg: '#64748B15' },
  ucim:  { label: 'Učim',  color: '#F59E0B', bg: '#F59E0B15' },
  znam:  { label: 'Znam',  color: '#22C55E', bg: '#22C55E15' },
}

const STATUS_NEXT = { nova: 'ucim', ucim: 'znam', znam: 'nova' }
const STATUS_ORDER = ['nova', 'ucim', 'znam']

function AddForm({ onSave, onCancel }) {
  const { t } = useApp()
  const [f, setF] = useState({ word: '', translation: '', example: '', lang: 'DE' })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const wordRef = useRef(null)

  function submit() {
    if (!f.word.trim() || !f.translation.trim()) return
    onSave(f)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 800,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end',
      animation: 'fadeIn 0.18s ease both',
    }} onClick={onCancel}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          background: 'linear-gradient(160deg, #0d1117 0%, #0a0d12 100%)',
          borderTop: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: '20px 20px 0 0',
          padding: '16px 16px 40px',
          animation: 'slideUp 0.28s cubic-bezier(0.34,1.4,0.64,1) both',
        }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', margin: '0 auto 18px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{t.new_word_form}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['EN', 'DE'].map(l => (
              <button key={l} type="button" onClick={() => set('lang', l)} style={{
                padding: '5px 14px', borderRadius: 8, fontFamily: 'inherit',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                background: f.lang === l ? (l === 'DE' ? '#3B82F620' : '#A855F720') : 'transparent',
                border: `0.5px solid ${f.lang === l ? (l === 'DE' ? '#3B82F6' : '#A855F7') : 'rgba(255,255,255,0.1)'}`,
                color: f.lang === l ? (l === 'DE' ? '#3B82F6' : '#A855F7') : 'var(--text-dim)',
              }}>
                {l === 'DE' ? '🇩🇪 DE' : '🇬🇧 EN'}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field-label">{t.word_phrase}</label>
          <input
            ref={wordRef}
            className="field-input"
            autoFocus
            value={f.word}
            onChange={e => set('word', e.target.value)}
            placeholder={f.lang === 'DE' ? 'npr. der Aufwand' : 'npr. endeavour'}
            style={{ fontSize: 17, fontWeight: 700 }}
          />
        </div>

        <div className="field">
          <label className="field-label">{t.translation_label}</label>
          <input
            className="field-input"
            value={f.translation}
            onChange={e => set('translation', e.target.value)}
            placeholder={t.translation_placeholder}
          />
        </div>

        <div className="field">
          <label className="field-label">{t.example_label} <span style={{ color: 'var(--text-dimmer)', fontWeight: 400 }}>{t.example_optional}</span></label>
          <input
            className="field-input"
            value={f.example}
            onChange={e => set('example', e.target.value)}
            placeholder={f.lang === 'DE' ? 'Der Aufwand lohnt sich.' : 'The endeavour was worth it.'}
          />
        </div>

        <button
          type="button"
          onClick={submit}
          style={{
            width: '100%', padding: '14px',
            background: f.word.trim() && f.translation.trim()
              ? `linear-gradient(135deg, ${f.lang === 'DE' ? '#3B82F6, #2563EB' : '#A855F7, #7C3AED'})`
              : 'rgba(255,255,255,0.05)',
            border: 'none', borderRadius: 12,
            color: f.word.trim() && f.translation.trim() ? 'white' : 'var(--text-dimmer)',
            fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {t.add_word_submit}
        </button>
      </div>
    </div>
  )
}

function FlashCard({ entry, onClose, onStatus }) {
  const { t } = useApp()
  const [flipped, setFlipped] = useState(false)
  const st = STATUS[entry.status]
  const langColor = entry.lang === 'DE' ? '#3B82F6' : '#A855F7'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 800,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24,
      animation: 'fadeIn 0.18s ease both',
    }} onClick={onClose}>
      <div
        onClick={e => { e.stopPropagation(); setFlipped(f => !f) }}
        style={{
          width: '100%', maxWidth: 380,
          minHeight: 220,
          background: 'linear-gradient(160deg, #0f1620 0%, #0a0d12 100%)',
          border: `0.5px solid ${langColor}40`,
          borderRadius: 20,
          padding: '28px 24px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          boxShadow: `0 0 60px ${langColor}20, 0 24px 48px rgba(0,0,0,0.5)`,
          cursor: 'pointer',
          animation: 'slideUp 0.28s cubic-bezier(0.34,1.4,0.64,1) both',
        }}
      >
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: langColor,
            letterSpacing: '1.5px', padding: '3px 10px',
            background: `${langColor}15`, borderRadius: 6,
          }}>
            {entry.lang}
          </div>
          <div style={{
            fontSize: 10, fontWeight: 600, color: st.color,
            padding: '3px 10px', background: st.bg, borderRadius: 6,
            letterSpacing: '0.5px',
          }}>
            {st.label}
          </div>
        </div>

        {/* Content */}
        {!flipped ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', textAlign: 'center', lineHeight: 1.2 }}>
              {entry.word}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dimmer)', marginTop: 12 }}>
              {t.flashcard_tap}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ fontSize: 13, color: 'var(--text-dimmer)', textAlign: 'center' }}>{entry.word}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: langColor, textAlign: 'center', lineHeight: 1.3 }}>
              {entry.translation}
            </div>
            {entry.example && (
              <div style={{
                marginTop: 8, fontSize: 12, color: 'var(--text-dim)',
                fontStyle: 'italic', textAlign: 'center', lineHeight: 1.5,
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 10, borderLeft: `2px solid ${langColor}60`,
              }}>
                "{entry.example}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16, width: '100%', maxWidth: 380 }}>
        {STATUS_ORDER.map(s => {
          const st2 = STATUS[s]
          const isActive = entry.status === s
          return (
            <button
              key={s}
              type="button"
              onClick={e => { e.stopPropagation(); onStatus(entry.id, s) }}
              style={{
                flex: 1, padding: '11px 0', borderRadius: 12,
                fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
                cursor: 'pointer', letterSpacing: '0.3px',
                background: isActive ? st2.bg : 'rgba(255,255,255,0.04)',
                border: `0.5px solid ${isActive ? st2.color : 'rgba(255,255,255,0.08)'}`,
                color: isActive ? st2.color : 'var(--text-dimmer)',
                transition: 'all 0.15s',
              }}
            >
              {st2.label}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onClose}
        style={{
          marginTop: 14, background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.25)', fontFamily: 'inherit',
          fontSize: 13, cursor: 'pointer',
        }}
      >
        {t.flashcard_close}
      </button>
    </div>
  )
}

export default function VocabScreen() {
  const { t } = useApp()
  const [vocab, setVocab] = useState(loadVocab)
  const [langFilter, setLangFilter] = useState('sve')
  const [statusFilter, setStatusFilter] = useState('sve')
  const [showAdd, setShowAdd] = useState(false)
  const [flashCard, setFlashCard] = useState(null)

  function persist(next) { setVocab(next); saveVocab(next) }

  function addWord(f) {
    const entry = {
      id: Date.now().toString(),
      word: f.word.trim(),
      translation: f.translation.trim(),
      example: f.example.trim(),
      lang: f.lang,
      status: 'nova',
      addedAt: new Date().toISOString().slice(0, 10),
    }
    persist([entry, ...vocab])
    setShowAdd(false)
  }

  function setStatus(id, status) {
    persist(vocab.map(v => v.id === id ? { ...v, status } : v))
    if (flashCard?.id === id) setFlashCard(f => ({ ...f, status }))
  }

  function del(id) {
    persist(vocab.filter(v => v.id !== id))
    if (flashCard?.id === id) setFlashCard(null)
  }

  const filtered = vocab.filter(v => {
    if (langFilter !== 'sve' && v.lang !== langFilter) return false
    if (statusFilter !== 'sve' && v.status !== statusFilter) return false
    return true
  })

  const total  = vocab.length
  const known  = vocab.filter(v => v.status === 'znam').length
  const learning = vocab.filter(v => v.status === 'ucim').length
  const fresh  = vocab.filter(v => v.status === 'nova').length

  return (
    <>
      {showAdd && <AddForm onSave={addWord} onCancel={() => setShowAdd(false)} />}
      {flashCard && (
        <FlashCard
          entry={flashCard}
          onClose={() => setFlashCard(null)}
          onStatus={setStatus}
        />
      )}

      <div className="screen fade-in">
        <div className="screen-header">
          <div>
          <div className="screen-label">VOKABELN</div>
            <div className="screen-title">{t.vocab_title}</div>
            <div className="screen-sub">{t.vocab_sub}</div>
          </div>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            style={{
              background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
              border: 'none', borderRadius: 10, padding: '9px 16px',
              color: 'white', fontFamily: 'inherit', fontSize: 12,
              fontWeight: 700, cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: 6,
              boxShadow: '0 4px 14px rgba(59,130,246,0.35)',
            }}
          >
            <Plus size={13} />
            {t.add_word_btn}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7, marginBottom: 14 }}>
          {[
            { label: t.total_words, value: total,    color: 'var(--text)' },
            { label: t.new_words,   value: fresh,    color: '#64748B' },
            { label: t.learning_words,   value: learning, color: '#F59E0B' },
            { label: t.known_words,   value: known,    color: '#22C55E' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card" style={{ textAlign: 'center', padding: '12px 6px' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color }}>{value}</div>
              <div style={{ fontSize: 8, color: 'var(--text-dimmer)', letterSpacing: '0.8px', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', height: 5, borderRadius: 4, overflow: 'hidden', gap: 1 }}>
              <div style={{ width: `${(fresh/total)*100}%`, background: '#64748B', transition: 'width 0.4s' }} />
              <div style={{ width: `${(learning/total)*100}%`, background: '#F59E0B', transition: 'width 0.4s' }} />
              <div style={{ width: `${(known/total)*100}%`, background: '#22C55E', transition: 'width 0.4s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: '#22C55E', fontWeight: 600 }}>
                {total > 0 ? Math.round((known/total)*100) : 0}{t.mastered_pct}
              </span>
            </div>
          </div>
        )}

        {/* Filters — Language */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {[
            { id: 'sve', label: t.filter_all_vocab },
            { id: 'DE',  label: '🇩🇪 Deutsch' },
            { id: 'EN',  label: '🇬🇧 English' },
          ].map(f => (
            <button key={f.id} type="button" onClick={() => setLangFilter(f.id)} style={{
              padding: '6px 12px', borderRadius: 8, fontFamily: 'inherit',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              background: langFilter === f.id ? 'var(--accent-dim)' : 'transparent',
              border: `0.5px solid ${langFilter === f.id ? 'var(--accent)' : 'var(--card-border)'}`,
              color: langFilter === f.id ? 'var(--accent)' : 'var(--text-dim)',
            }}>{f.label}</button>
          ))}
        </div>

        {/* Filters — Status */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[{ id: 'sve', label: t.filter_all_vocab, color: 'var(--accent)' }, ...STATUS_ORDER.map(s => ({ id: s, label: STATUS[s].label, color: STATUS[s].color }))].map(f => (
            <button key={f.id} type="button" onClick={() => setStatusFilter(f.id)} style={{
              padding: '5px 11px', borderRadius: 8, fontFamily: 'inherit',
              fontSize: 10, fontWeight: 600, cursor: 'pointer',
              background: statusFilter === f.id ? `${f.color}15` : 'transparent',
              border: `0.5px solid ${statusFilter === f.id ? f.color : 'var(--card-border)'}`,
              color: statusFilter === f.id ? f.color : 'var(--text-dimmer)',
            }}>{f.label}</button>
          ))}
        </div>

        {/* Word list */}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: 'rgba(59,130,246,0.08)',
              border: '0.5px solid rgba(59,130,246,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <BookOpen weight="fill" size={28} style={{ color: '#3B82F6' }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
              {vocab.length === 0 ? t.vocab_empty_title : t.vocab_no_results}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dimmer)', lineHeight: 1.6 }}>
              {vocab.length === 0 ? t.vocab_empty_sub : t.vocab_change_filter}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(entry => {
            const st = STATUS[entry.status]
            const langColor = entry.lang === 'DE' ? '#3B82F6' : '#A855F7'
            return (
              <div
                key={entry.id}
                className="card"
                style={{ cursor: 'pointer', borderLeft: `2.5px solid ${langColor}` }}
                onClick={() => setFlashCard(entry)}
              >
                <div className="card-glow" />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  {/* Lang badge */}
                  <div style={{
                    flexShrink: 0, marginTop: 2,
                    fontSize: 9, fontWeight: 700, color: langColor,
                    padding: '3px 7px', background: `${langColor}15`,
                    borderRadius: 5, letterSpacing: '0.5px',
                  }}>
                    {entry.lang}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 2 }}>
                      {entry.word}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: entry.example ? 6 : 0 }}>
                      {entry.translation}
                    </div>
                    {entry.example && (
                      <div style={{ fontSize: 11, color: 'var(--text-dimmer)', fontStyle: 'italic' }}>
                        "{entry.example}"
                      </div>
                    )}
                    <div style={{ marginTop: 6, fontSize: 9, color: 'var(--text-dimmer)' }}>
                      {entry.addedAt}
                    </div>
                  </div>

                  {/* Right side */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <div style={{
                      fontSize: 9, fontWeight: 700, color: st.color,
                      padding: '3px 8px', background: st.bg, borderRadius: 6,
                    }}>
                      {st.label}
                    </div>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); del(entry.id) }}
                      style={{
                        background: 'none', border: 'none',
                        color: 'var(--text-dimmer)', cursor: 'pointer',
                        fontSize: 18, padding: '0 2px', lineHeight: 1,
                      }}
                    >×</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ height: 20 }} />
      </div>
    </>
  )
}
