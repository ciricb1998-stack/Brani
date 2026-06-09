import { useState } from 'react'
import { useApp } from '../App.jsx'
import { loadFinance, saveFinance } from '../utils/storage.js'
import { Plus, Minus } from '@phosphor-icons/react'

const EXPENSE_CATS = ['Software','Marketing','Oprema','Transport','Kancelarija','Porezi','Ostalo']
const MONTH_FULL = ['Januar','Februar','Mart','April','Maj','Juni','Juli','Avgust','Septembar','Oktobar','Novembar','Decembar']

function mKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`
}

function AddEntry({ type, monthKey, onSave, onCancel }) {
  const { t } = useApp()
  const isIncome = type === 'income'
  const [f, setF] = useState({ date: monthKey + '-01', category: 'Software' })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, padding: '0 8px 0 0' }}>← Nazad</button>
        <div className="screen-title" style={{ color: isIncome ? '#22c55e' : '#ef4444' }}>
          {isIncome ? t.new_income : t.new_expense}
        </div>
      </div>

      <div className="card">
        <div className="card-glow" />
        <div className="field">
          <label className="field-label">{t.amount_label}</label>
          <input className="field-input" type="number" step="0.01" autoFocus value={f.amount || ''} onChange={e => set('amount', e.target.value)} placeholder="0.00" style={{ fontSize: 20, fontWeight: 700 }} />
        </div>

        <div className="field">
          <label className="field-label">{t.date_field}</label>
          <input className="field-input" type="date" value={f.date} onChange={e => set('date', e.target.value)} />
        </div>

        {isIncome ? (
          <div className="field">
            <label className="field-label">{t.client_source}</label>
            <input className="field-input" value={f.client || ''} onChange={e => set('client', e.target.value)} placeholder={t.client_source_placeholder} />
          </div>
        ) : (
          <div className="field">
            <label className="field-label">{t.category_label}</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {EXPENSE_CATS.map(c => (
                <button key={c} type="button" onClick={() => set('category', c)} style={{
                  padding: '6px 11px', borderRadius: 8, fontFamily: 'inherit', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  background: f.category === c ? '#ef444420' : 'transparent',
                  border: `0.5px solid ${f.category === c ? '#ef4444' : 'var(--card-border)'}`,
                  color: f.category === c ? '#ef4444' : 'var(--text-dim)',
                }}>{c}</button>
              ))}
            </div>
          </div>
        )}

        <div className="field">
          <label className="field-label">{t.description_label}</label>
          <input className="field-input" value={f.desc || ''} onChange={e => set('desc', e.target.value)} placeholder={t.desc_placeholder} />
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 4, background: isIncome ? '#22c55e' : '#ef4444' }}
          onClick={() => { if (f.amount) onSave(f) }}
        >
          {isIncome ? t.add_income_btn : t.add_expense_btn}
        </button>
      </div>
    </div>
  )
}

export default function FinanceScreen() {
  const { t } = useApp()
  const today = new Date()
  const [finance, setFinance] = useState(loadFinance)
  const [viewMonth, setViewMonth] = useState(mKey(today))
  const [adding, setAdding] = useState(null)

  function persist(next) { setFinance(next); saveFinance(next) }

  function addEntry(type, f) {
    const entry = { id: Date.now().toString(), ...f }
    const next = {
      income:   type === 'income'  ? [...finance.income, entry]   : finance.income,
      expenses: type === 'expense' ? [...finance.expenses, entry] : finance.expenses,
    }
    persist(next)
    setAdding(null)
  }

  function del(type, id) {
    const next = {
      income:   type === 'income'  ? finance.income.filter(e => e.id !== id)   : finance.income,
      expenses: type === 'expense' ? finance.expenses.filter(e => e.id !== id) : finance.expenses,
    }
    persist(next)
  }

  const [vm_y, vm_m] = viewMonth.split('-').map(Number)

  function prevMonth() {
    const d = new Date(vm_y, vm_m - 2, 1)
    setViewMonth(mKey(d))
  }
  function nextMonth() {
    const d = new Date(vm_y, vm_m, 1)
    setViewMonth(mKey(d))
  }

  const income   = finance.income.filter(e => e.date.startsWith(viewMonth))
  const expenses = finance.expenses.filter(e => e.date.startsWith(viewMonth))
  const totalIn  = income.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const totalEx  = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const profit   = totalIn - totalEx

  const yearIn  = finance.income.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const yearEx  = finance.expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const yearPro = yearIn - yearEx

  if (adding) {
    return <AddEntry type={adding} monthKey={viewMonth} onSave={f => addEntry(adding, f)} onCancel={() => setAdding(null)} />
  }

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div>
          <div className="screen-label">FINANZEN</div>
          <div className="screen-title">{t.finance_title}</div>
          <div className="screen-sub">{t.finance_sub}</div>
        </div>
      </div>

      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button type="button" onClick={prevMonth} style={{ background: 'var(--card)', border: '0.5px solid var(--card-border)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: 'var(--text-dim)', fontFamily: 'inherit' }}>‹</button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{MONTH_FULL[vm_m-1]} {vm_y}</div>
        <button type="button" onClick={nextMonth} style={{ background: 'var(--card)', border: '0.5px solid var(--card-border)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: 'var(--text-dim)', fontFamily: 'inherit' }}>›</button>
      </div>

      {/* Monthly KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 10 }}>
        {[
          { label: t.income_label,   value: totalIn,  color: '#22c55e', sign: '+' },
          { label: t.expenses_label, value: totalEx,  color: '#ef4444', sign: '-' },
          { label: t.profit_label,   value: profit,   color: profit >= 0 ? '#22c55e' : '#ef4444', sign: profit >= 0 ? '+' : '' },
        ].map(({ label, value, color, sign }) => (
          <div key={label} className="card" style={{ textAlign: 'center', padding: '14px 6px' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color }}>{value < 0 ? '-' : sign}€{Math.abs(value).toLocaleString()}</div>
            <div style={{ fontSize: 9, color: 'var(--text-dimmer)', letterSpacing: '0.8px', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Year total */}
      <div className="card" style={{ padding: '13px 16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 2 }}>{t.yearly_profit} ({vm_y})</div>
            <div style={{ display: 'flex', gap: 14 }}>
              <span style={{ fontSize: 11, color: '#22c55e' }}>+€{yearIn.toLocaleString()}</span>
              <span style={{ fontSize: 11, color: '#ef4444' }}>-€{yearEx.toLocaleString()}</span>
            </div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: yearPro >= 0 ? '#22c55e' : '#ef4444' }}>
            {yearPro < 0 ? '-' : '+'}€{Math.abs(yearPro).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button className="btn btn-outline" style={{ flex: 1, borderColor: '#22c55e', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }} onClick={() => setAdding('income')}>
          <Plus size={13} />
          {t.income_section}
        </button>
        <button className="btn btn-outline" style={{ flex: 1, borderColor: '#ef4444', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }} onClick={() => setAdding('expense')}>
          <Minus size={13} />
          {t.expenses_section}
        </button>
      </div>

      {/* Income */}
      {income.length > 0 && (
        <>
          <div className="section-title">{t.income_section}</div>
          {[...income].sort((a,b) => b.date.localeCompare(a.date)).map(e => (
            <div key={e.id} className="card" style={{ marginBottom: 7, display: 'flex', alignItems: 'center', gap: 10, borderLeft: '2.5px solid #22c55e' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{e.client || t.income_entry}</div>
                {e.desc && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{e.desc}</div>}
                <div style={{ fontSize: 10, color: 'var(--text-dimmer)' }}>{e.date}</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#22c55e', flexShrink: 0 }}>+€{parseFloat(e.amount).toLocaleString()}</div>
              <button type="button" onClick={() => del('income', e.id)} style={{ background: 'none', border: 'none', color: 'var(--text-dimmer)', cursor: 'pointer', fontSize: 18, padding: '0 2px' }}>×</button>
            </div>
          ))}
        </>
      )}

      {/* Expenses */}
      {expenses.length > 0 && (
        <>
          <div className="section-title">{t.expenses_section}</div>
          {[...expenses].sort((a,b) => b.date.localeCompare(a.date)).map(e => (
            <div key={e.id} className="card" style={{ marginBottom: 7, display: 'flex', alignItems: 'center', gap: 10, borderLeft: '2.5px solid #ef4444' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{e.category || t.expense_entry}</div>
                {e.desc && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{e.desc}</div>}
                <div style={{ fontSize: 10, color: 'var(--text-dimmer)' }}>{e.date}</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#ef4444', flexShrink: 0 }}>-€{parseFloat(e.amount).toLocaleString()}</div>
              <button type="button" onClick={() => del('expense', e.id)} style={{ background: 'none', border: 'none', color: 'var(--text-dimmer)', cursor: 'pointer', fontSize: 18, padding: '0 2px' }}>×</button>
            </div>
          ))}
        </>
      )}

      {income.length === 0 && expenses.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dimmer)', fontSize: 13 }}>
          {t.no_entries_month} {MONTH_FULL[vm_m-1]}
        </div>
      )}
    </div>
  )
}
