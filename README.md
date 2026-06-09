# BRANI SYSTEM v2.0 — Premium PWA

**React + Vite + PWA** — Instalabilna mobilna aplikacija za iPhone/Android

---

## Pokretanje

```bash
cd BRANIGROUP/brani-system
npm install
npm run dev
```

Otvori `http://localhost:5173` u Safari (iPhone) ili Chrome (Android).

## Build za produkciju

```bash
npm run build
npm run preview
```

## Instalacija na iPhone

1. Otvori `http://localhost:5173` u **Safari**
2. Tap **Share** → **"Add to Home Screen"**
3. App se instalira kao native!

---

## Struktura projekta (za Claude Code)

```
brani-system/
├── src/
│   ├── App.jsx              # Glavni app + routing
│   ├── screens/
│   │   ├── Dashboard.jsx    # Home screen, stats, kalendar ikone
│   │   ├── CalendarScreen.jsx  # Kalendar s praćenjem dana
│   │   ├── PlannerScreen.jsx   # Dnevni/sedmični planer
│   │   ├── ExportScreen.jsx    # Premium PDF export
│   │   └── SettingsScreen.jsx  # Brand, jezik, tema
│   ├── components/
│   │   └── BottomNav.jsx    # Donja navigacija
│   ├── data/
│   │   ├── brands.js        # BRANI+, BRANI, LOG konfiguracije
│   │   └── months.js        # 12 mjeseci + SVG ikonice
│   ├── utils/
│   │   ├── storage.js       # localStorage helper
│   │   └── pdfExport.js     # Premium PDF generator
│   └── styles/
│       └── global.css       # BRANI dark theme
├── package.json
└── vite.config.js           # PWA konfiguracija
```

## Brendovi

| Brand | Boje | Tagline |
|-------|------|---------|
| BRANI+ | #2563EB (plava) + srebrna | DIGITAL · SOLUTIONS · EXCELLENCE |
| BRANI | #3B82F6 (plava) + tamno plava | DISCIPLINE · DOCUMENT · DELIVER |
| LOG | #A855F7 (ljubičasta) + crna | TRACK · GROW · COMPOUND |

## Features

- ✅ **Dashboard** — statistike, streak, today tasks, 12-month grid
- ✅ **Kalendar** — praćenje svakog dana, colour coding, monthly stats
- ✅ **Planer** — dnevni check-in, zadaci, reflekcija / sedmični goals
- ✅ **Premium PDF export** — branded daily, weekly, monthly reports
- ✅ **3 brenda** — BRANI+, BRANI, LOG (prepne u Settings)
- ✅ **3 jezika** — Bosanski, Deutsch, English
- ✅ **Offline** — PWA, radi bez interneta
- ✅ **Instalabilno** — Add to Home Screen na iOS i Android

## Sljedeći koraci (za Claude Code)

- [ ] Integracija s Notion API (sync notes)
- [ ] Integracija s Google Calendar
- [ ] Push notifikacije (jutarnji reminder)
- [ ] Cloud backup (Supabase/Firebase)
- [ ] Habit tracker screen
- [ ] Revenue dashboard s grafikonima
