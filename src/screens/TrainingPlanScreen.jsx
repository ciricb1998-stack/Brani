import { useState } from 'react'
import { useApp } from '../App.jsx'
import { loadRecoverySessions, saveRecoverySessions } from '../utils/storage.js'
import { CheckCircle, MapPin, Clock, CaretDown, CaretUp } from '@phosphor-icons/react'

const PLAN_YEAR = 2026

const PHASE1 = {
  1: { name: 'Unterkörper A', focus: 'Quadrizeps + Drücken + KH-Kondition', duration: 95, location: 'Heim', type: 'trening', color: '#f97316' },
  2: { name: 'Oberkörper Zug + Core', focus: 'Rücken, Bizeps, Anti-Rot. Core', duration: 90, location: 'Heim', type: 'trening', color: '#3b82f6' },
  3: { name: 'Unterkörper B', focus: 'Gesäss + Hintere Kette + Kniestabilisation', duration: 95, location: 'Heim', type: 'rehab', color: '#a855f7' },
  4: { name: 'Oberkörper + Kondition', focus: 'Brust, Schultern, Trizeps + Tabata', duration: 90, location: 'Heim', type: 'trening', color: '#3b82f6' },
  5: { name: 'Ganzkörper-Circuit', focus: 'Profifussball-Konditionstraining', duration: 95, location: 'Heim', type: 'cardio', color: '#f59e0b' },
  6: { name: 'Schwimmbad', focus: 'Aqua-Jogging Intervalle + Oberkörper Wasser', duration: 95, location: 'Becken (oder Heim-Ersatz)', type: 'cardio', color: '#22c55e' },
  0: { name: 'Aktive Erholung', focus: 'Spaziergang + Dehnen + Knieprotokoll', duration: 60, location: 'Aussen', type: 'odmor', color: '#64748b' },
}

const PHASE2 = {
  1: { name: 'Schwimmbad — Intervalle', focus: 'Aqua-Jogging Cooper-Vorbereitung', duration: 95, location: 'Becken (oder Heim-Ersatz)', type: 'cardio', color: '#22c55e' },
  2: { name: 'Gym — Beine + Drücken', focus: 'Beinpresse + Step-up KH + Bankdrücken + Core', duration: 100, location: 'Gym', type: 'trening', color: '#f97316' },
  3: { name: 'Gym — Zug + Posterior', focus: 'Rudern + RDL + Nordisches Beinheben + Core', duration: 100, location: 'Gym', type: 'trening', color: '#3b82f6' },
  4: { name: 'Heim — Erholung + Knie', focus: 'Foam Roller + Mobilität + Knieprotokoll', duration: 60, location: 'Heim', type: 'odmor', color: '#64748b' },
  5: { name: 'Gym — Ganzkörper Power', focus: 'Squat-Muster + Oberkörper + Konditionsfinisher', duration: 100, location: 'Gym', type: 'trening', color: '#f97316' },
  6: { name: 'Laufen + Gym', focus: 'Erste Laufeinheit (Physio-Freigabe) + Oberkörper', duration: 90, location: 'Feld/Gym', type: 'utakmica', color: '#22c55e' },
  0: { name: 'Aktive Erholung', focus: 'Spaziergang + Dehnen + Knieprotokoll', duration: 60, location: 'Aussen', type: 'odmor', color: '#64748b' },
}

// Full exercise: { name, gerat, warum, ausfuhrung, tempo, sets }
const KNIEPROTOKOLL = {
  title: 'KNIEPROTOKOLL — täglich, NIEMALS überspringen (12–15 Min)',
  color: '#ef4444',
  note: 'Nach Kniespiegelung wird der Knorpel durch Bewegung ernährt — nicht durch Ruhe. Täglich verhindert neue Vernarbung.',
  exercises: [
    { name: 'Quad Set', sets: '3 × 20 Sek.', gerat: 'Matte / Boden', warum: 'Post-OP Grundübung. Quadrizeps anspannen ohne Kniebewegung — reaktiviert Nervenverbindung zum Muskel.', ausfuhrung: 'Bein gestreckt auf Boden. Quadrizeps maximal anspannen (Knie in Boden drücken). 20 Sek. halten.', tempo: 'STATISCH HALTEN — tief atmen, nicht verkrampfen.' },
    { name: 'TKE — Terminal Kniestreckung', sets: '3 × 20 Wdh.', gerat: 'Band am Türrahmen, um Knie geschlungen', warum: 'Stärkt Quadrizeps in den letzten 15° der Streckung — genau dort wo er nach OP am schwächsten ist. Täglich Pflicht.', ausfuhrung: 'Band unter Spannung. Knie aus leichter Beugung vollständig strecken. Am Ende 2 Sek. halten. Langsam zurück.', tempo: 'KONTROLLIERT — kein Schwung, reine Quadrizeps-Arbeit.' },
    { name: 'Gestrecktes Beinheben', sets: '3 × 15 Wdh.', gerat: 'Matte / Körpergewicht', warum: 'Knie bleibt gestreckt — Hüftbeuger + Quadrizeps arbeiten ohne Kniebelastung. Aufbau ohne Gelenkstress.', ausfuhrung: 'Rücken auf Boden. Ein Bein gestreckt hochheben bis 45°. Kurz halten, kontrolliert absenken.', tempo: 'LANGSAM — 2 Sek. hoch, 2 Sek. runter.' },
    { name: 'Band Clamshell', sets: '3 × 20 Wdh.', gerat: 'Widerstandsband über den Knien', warum: 'Gluteus medius + minimus. Kleine Muskeln, grosse Wirkung auf seitliche Kniestabilität. Nach OP täglich aktivieren.', ausfuhrung: 'Seitenliege. Band über Knien. Füsse zusammen. Oberes Knie öffnen wie Muschel — Becken ruhig halten!', tempo: 'KONTROLLIERT — Gesäss führt, kein Rücken-Rotieren.' },
    { name: 'Fersenschlitten', sets: '2 × 15 Wdh.', gerat: 'Matte / Körpergewicht', warum: 'Erhält aktiven Knie-Bewegungsumfang. Ferse gleitet langsam zum Gesäss — stimuliert Synovialflüssigkeit.', ausfuhrung: 'Rücken auf Boden. Ferse langsam zum Gesäss schieben (soweit schmerzfrei). Langsam zurückgleiten.', tempo: 'SEHR LANGSAM — 4 Sek. hin, 4 Sek. zurück.' },
    { name: 'Einbeiniges Gleichgewicht', sets: '3 × 30 Sek. je Bein', gerat: 'Körpergewicht | optional weiches Kissen (schwerer)', warum: 'Propriozeption nach Knie-OP stark beeinträchtigt. Ohne Training steigt Wiederholungsverletzungs-Risiko um 50%.', ausfuhrung: 'Einbeinig stehen, Knie leicht gebeugt. Fortschritt: Augen zu / auf Kissen / Mini-Kniebeugen einbauen.', tempo: 'STATISCH und KONTROLLIERT — weiteratmen.' },
    { name: 'Mini-Kniebeuge (0–40°)', sets: '2 × 15 Wdh.', gerat: 'Körpergewicht | Wand zur Hilfe', warum: 'Knie aktiv bewegen im sicheren Bereich. Kein Schmerz akzeptabel — sofort stoppen wenn Schmerz!', ausfuhrung: 'Aufrecht stehen, leicht nach vorne lehnen. Nur bis 40° Beugung runtergehen. Durch Fersen hochdrücken.', tempo: 'KONTROLLIERT — 2 Sek. runter, 1 Sek. oben.' },
  ],
}

const KNIE_AMPEL = [
  { color: '#22c55e', label: 'GRÜN', desc: 'Kein Schmerz, keine Schwellung, normaler Bewegungsumfang → Volles Training nach Plan.' },
  { color: '#f59e0b', label: 'GELB', desc: 'Leichte Steifigkeit morgens oder Wärme nach Training → Training fortführen aber Knie-Übungen 50% reduzieren. Eis 15 Min.' },
  { color: '#ef4444', label: 'ROT', desc: 'Schmerz bei Belastung, deutliche Schwellung, Wärme + Rötung → SOFORT STOPPEN. Eis 20 Min. Physiotherapeuten kontaktieren!' },
]

const PROGRAMS = {
  p1_1: [
    {
      title: 'AKTIVIERUNG — 12 Min', color: '#22c55e', exercises: [
        { name: 'Band Lateral Walk', sets: '3 × 15 je Seite', gerat: 'Widerstandsband um die Oberschenkel', warum: 'Aktiviert Gluteus medius — stabilisiert das Knie seitlich. Nach Knie-OP oft geschwächt. Ohne ihn knickt das Knie beim Laufen und Landen ein.', ausfuhrung: 'Band knapp über den Knien. Knie leicht gebeugt. Kleine Seitschritte — 15 rechts / 15 links. Nicht aufrechtstellen zwischen den Schritten.', tempo: 'KONTROLLIERT — gleichmässiges Tempo, Spannung im Band halten.' },
        { name: 'TKE — Terminal Kniestreckung', sets: '3 × 20 Wdh.', gerat: 'Band am Türrahmen / Möbel, um das Knie geschlungen', warum: 'DIE Schlüsselübung nach Kniespiegelung. Trainiert Quadrizeps in letzten 15° der Streckung — genau dort wo er nach OP am schwächsten ist.', ausfuhrung: 'Band unter Spannung, Knie aus leichter Beugung vollständig strecken. Am Ende 2 Sek. halten. Langsam zurück.', tempo: 'KONTROLLIERT — kein Schwung. Reine Quadrizeps-Muskelarbeit.' },
        { name: 'Hüftkreisel', sets: '2 × 10 je Seite', gerat: 'Körpergewicht', warum: 'Mobilisiert Hüftgelenk in allen Ebenen. Bereitet Hüfte und Knie auf Belastung vor.', ausfuhrung: 'Einbeinig stehen. Knie hochziehen und langsam in grossem Kreis rotieren.', tempo: 'LANGSAM und kontrolliert.' },
      ],
    },
    {
      title: 'HAUPTTRAINING — QUADRIZEPS 35 Min', color: '#f97316', exercises: [
        { name: 'Goblet Kniebeuge (partial)', sets: '4 × 12 | KH 12,5 kg', gerat: '1 Kurzhantel 12,5 kg, vor der Brust gehalten', warum: 'Stärkt Quadrizeps und Gesäss bei kontrollierter Kniebelastung. "Partial" = nur bis 60–70° Beugung, schmerzfreier Bereich.', ausfuhrung: 'Schulterbreiter Stand, KH vertikal vor der Brust. Langsam in Kniebeuge (max. 70°, kein Schmerz). Durch Fersen hochdrücken. Knie zeigen über Zehen — nie nach innen.', tempo: 'HINUNTER: 4 Sek. kontrolliert. HINAUF: explosiv durch Fersen. Oben 1 Sek. halten.' },
        { name: 'Seitlicher Box Step-up', sets: '4 × 12 je Bein | KH 12,5 kg', gerat: '2 Kurzhanteln 12,5 kg | Stuhl/Stufe 30–40 cm', warum: 'Unilaterale Übung — ein Bein arbeitet alleine. Stärkt das operierte Knie gezielt, verbessert Propriozeption. Seitliches Aufsteigen = spezifisch für Fussball (Richtungswechsel).', ausfuhrung: 'Seitlich zur Stufe stehen. Fuss komplett auf Stufe. Durch Ferse hochdrücken — Knie NICHT nach innen! Anderes Bein kontrolliert nachführen.', tempo: 'HINAUF: Woche 1–2 kontrolliert, ab Woche 3 explosiv. HINUNTER: immer 3 Sek. langsam.' },
        { name: 'Rückwärtsausfallschritt', sets: '3 × 10 je Bein | KH 12,5 kg', gerat: '2 Kurzhanteln 12,5 kg', warum: 'Weniger Kniebelastung als Vorwärtsausfallschritt. Rückwärts = weniger Scherkräfte auf Kniegelenk. Stärkt Quadrizeps und Gesäss funktionell.', ausfuhrung: 'Grosser Schritt nach hinten. Hinteres Knie fast zum Boden. Vorderes Knie max. 90°. Durch vordere Ferse hochdrücken.', tempo: 'HINUNTER: 3 Sek. HINAUF: stark und zügig.' },
        { name: 'Wandsitzen (Wall Sit)', sets: '3 × 45 Sek.', gerat: 'Wand + Körpergewicht', warum: 'Isometrische Übung = Muskel arbeitet unter Spannung ohne Gelenkbewegung. Baut Quadrizepskraft auf ohne Gelenkstress. Standard in jedem Profi-Kniereha-Protokoll.', ausfuhrung: 'Rücken flach an Wand. Knie auf 90° (oder so weit wie schmerzfrei). Oberschenkel parallel zum Boden. Position halten.', tempo: 'STATISCH halten. Atmen nicht vergessen.' },
      ],
    },
    {
      title: 'KH-KOMPLEX FINISHER — 15 Min', color: '#f59e0b', exercises: [
        { name: '4 Runden | 90 Sek. Pause | KH NICHT ablegen', sets: '', gerat: '', warum: 'Hält Herzfrequenz bei 80–85% — aerobe Basis ohne Laufen. Professioneller Standard in Reha-Konditionierung.', ausfuhrung: 'Alle 5 Übungen hintereinander ohne die KH abzulegen. 8 Wdh. je Übung.', tempo: '' },
        { name: '1. Rumänisches Kreuzheben', sets: '8 Wdh.', gerat: 'KH 12,5 kg', warum: 'Hintere Kette — Hamstrings + Gesäss', ausfuhrung: '', tempo: 'Kontrolliert' },
        { name: '2. KH-Rudern beidhändig', sets: '8 Wdh.', gerat: 'KH 12,5 kg', warum: 'Rücken + Bizeps', ausfuhrung: '', tempo: 'Explosiv ziehen' },
        { name: '3. KH-Bodendrücken', sets: '8 Wdh.', gerat: 'KH 12,5 kg', warum: 'Brust + Trizeps', ausfuhrung: '', tempo: 'Explosiv drücken' },
        { name: '4. Goblet Kniebeuge (leicht)', sets: '8 Wdh.', gerat: 'KH 12,5 kg', warum: 'Beine + Herzfrequenz hochhalten', ausfuhrung: '', tempo: 'Zügig' },
        { name: '5. KH-Schulterdrücken', sets: '8 Wdh.', gerat: 'KH 12,5 kg', warum: 'Schultern + Ausdauer', ausfuhrung: '', tempo: 'Stark drücken' },
      ],
    },
    KNIEPROTOKOLL,
  ],

  p1_2: [
    {
      title: 'AKTIVIERUNG — 12 Min', color: '#22c55e', exercises: [
        { name: 'Band Pull-Apart', sets: '3 × 20 Wdh.', gerat: 'Widerstandsband (mittlere Stärke)', warum: 'Aktiviert mittleres Trapez und hintere Schulter. Gegenspieler zur Drückbewegung. Schützt Schultergelenk. Pflicht in jedem Profi-S&C-Programm.', ausfuhrung: 'Band schulterbreit vor dem Körper. Auseinanderziehen bis es die Brust berührt. Schulterblätter zusammenziehen. Kontrolliert zurück.', tempo: 'KONTROLLIERT — am Ende 1 Sek. halten, Schulterblätter maximal zusammendrücken.' },
        { name: 'Band Face Pull', sets: '3 × 15 Wdh.', gerat: 'Widerstandsband auf Kopfhöhe befestigt', warum: 'Stärkt Aussenrotatoren der Schulter. Verhindert Schulterprobleme die bei einseitigem Drücktraining entstehen.', ausfuhrung: 'Band auf Kopfhöhe. Ellenbogen hochhalten. Band zum Gesicht ziehen — Hände neben den Ohren. Schulterblätter zusammen.', tempo: 'LANGSAM — kein Schwung, reine Schulterarbeit.' },
      ],
    },
    {
      title: 'HAUPTTRAINING — OBERKÖRPER ZUG 40 Min', color: '#3b82f6', exercises: [
        { name: 'KH-Rudern vorgebeugt', sets: '4 × 12 | KH 12,5 kg', gerat: '2 Kurzhanteln 12,5 kg', warum: 'Grundübung für Latissimus, mittleren Rücken und Bizeps. Im Fussball entscheidend für Zweikampfstärke und Körperbalance.', ausfuhrung: 'Hüftbreit stehen, Knie leicht gebeugt, Oberkörper 45° vorgebeugt. Rücken gerade. Mit Ellenbogen führen — nah am Körper zur Hüfte ziehen. Schulterblätter zusammen.', tempo: 'ZIEHEN: explosiv (1 Sek.). ABSENKEN: 3 Sek. kontrolliert — exzentrische Phase ist Schlüssel.' },
        { name: 'KH-Einarmiges Rudern', sets: '4 × 12 je Seite | KH 12,5 kg', gerat: '1 Kurzhantel 12,5 kg | Stuhl als Stütze', warum: 'Unilateral = pro Seite bessere Muskelkontraktion, mehr Core-Aktivierung. Deckt Kraft-Asymmetrien auf.', ausfuhrung: 'Knie und Hand auf Stuhl abstützen. KH hängen lassen. Ellenbogen führen bis zur Hüfte. Schulterblatt am Ende zusammendrücken. Hüfte nicht rotieren.', tempo: 'ZIEHEN: explosiv. ABLASSEN: 3–4 Sek. langsam.' },
        { name: 'Band-Rudern', sets: '3 × 15 Wdh.', gerat: 'Starkes Widerstandsband (um Tischbein / Türrahmen)', warum: 'Ergänzt KH-Rudern mit konstantem Widerstand — kein toter Punkt. Maximale Muskelspannung durch gesamten Bewegungsablauf.', ausfuhrung: 'Band niedrig befestigen. Aufrecht. Ellenbogen nah am Körper ziehen. Schulterblätter zusammen. Kontrolliert zurück.', tempo: 'ZIEHEN: stark. ZURÜCK: 2–3 Sek. kontrolliert.' },
        { name: 'KH-Bizepscurl', sets: '3 × 15 | KH 12,5 kg', gerat: '2 Kurzhanteln 12,5 kg', warum: 'Bizeps ist Ellenbogenbeuger und Schultergelenkstabilisator. Im Zweikampf und bei Kopfballduellen direkt involviert.', ausfuhrung: 'Aufrecht stehen. Untergriff. Nur aus Ellenbogen beugen — kein Schwingen! Bis oben, 1 Sek. halten, langsam absenken.', tempo: 'BEUGEN: stark. ABSENKEN: 3 Sek. exzentrisch — Hauptwachstumsreiz.' },
        { name: 'KH-Hammercurl', sets: '3 × 12 | KH 12,5 kg', gerat: '2 Kurzhanteln 12,5 kg', warum: 'Trainiert Brachialis und Brachioradialis — Unterarmkraft, bei normalem Curl vernachlässigt.', ausfuhrung: 'Wie Bizepscurl, Handflächen zur Körpermitte (Daumen oben).', tempo: 'KONTROLLIERT — kein Schwung.' },
      ],
    },
    {
      title: 'CORE — ANTI-ROTATION 25 Min', color: '#a855f7', exercises: [
        { name: 'Copenhagen Plank', sets: '3 × 20 Sek. je Seite', gerat: 'Couch oder Stuhl', warum: 'Studien zeigen 41% Reduktion von Leistenverletzungen bei Fussballern. Stärkt Adduktoren + seitlichen Core. Pflicht für jeden Fussballer.', ausfuhrung: 'Seitliege. Oberes Bein auf Stuhl. Hüfte hochdrücken — gerade Körperlinie. Unteres Bein hängt frei (schwerer) oder bleibt am Boden.', tempo: 'STATISCH HALTEN — weiteratmen.' },
        { name: 'Pallof Press (Anti-Rotation)', sets: '3 × 12 je Seite', gerat: 'Widerstandsband seitlich auf Hüfthöhe befestigt', warum: 'Anti-Rotations-Core. Körper kämpft gegen seitliche Zugkraft. Trainiert Core-Stabilität — relevant für Pässe, Schüsse, Richtungswechsel.', ausfuhrung: 'Seitlich zum Band. Band mit beiden Händen vor Brust. Direkt von Brust wegdrücken — kein Rotieren! 2 Sek. gestreckt halten, zurück.', tempo: 'LANGSAM herausdrücken und zurückziehen.' },
        { name: 'Dead Bug (Toter Käfer)', sets: '3 × 10 je Seite', gerat: 'Matte / Körpergewicht', warum: 'Anti-Extensions-Core. Hält Lendenwirbelsäule neutral während Extremitäten bewegt werden. Schützt Rücken bei allen Fussball-Bewegungen.', ausfuhrung: 'Rücken auf Boden. Arme senkrecht nach oben. Hüfte/Knie 90°. Abwechselnd rechten Arm + linkes Bein ausstrecken — kurz vor Boden halten. Rücken bleibt AM BODEN!', tempo: 'SEHR LANGSAM — 3 Sek. strecken, 3 Sek. zurück.' },
      ],
    },
    KNIEPROTOKOLL,
  ],

  p1_3: [
    {
      title: 'AKTIVIERUNG — 12 Min', color: '#22c55e', exercises: [
        { name: 'Band Clamshell', sets: '3 × 20 je Seite', gerat: 'Widerstandsband über den Knien', warum: 'Isoliert Gluteus medius und minimus — stabilisieren das Knie seitlich. Nach OP oft geschwächt, muss täglich aktiviert werden.', ausfuhrung: 'Seitenliege. Band über Knien. Füsse zusammen. Oberes Knie öffnen wie Muschel. Becken ruhig halten.', tempo: 'KONTROLLIERT — Gesäss führt, kein Rücken-Rotieren.' },
        { name: 'Bodyweight Glute Bridge (Aufwärmen)', sets: '2 × 15 Wdh.', gerat: 'Matte / Körpergewicht', warum: 'Aktiviert Gluteus maximus und Hamstrings vor der Hauptbelastung. Kein Kniestress.', ausfuhrung: 'Rücken auf Boden, Knie gebeugt, Füsse hüftbreit. Hüfte hochdrücken bis Linie Schulter-Hüfte-Knie. 2 Sek. halten.', tempo: 'HINAUF: explosiv. OBEN: 2 Sek. Gesäss zusammendrücken. HINUNTER: 3 Sek.' },
      ],
    },
    {
      title: 'HAUPTTRAINING — GESÄSS + HINTERE KETTE 45 Min', color: '#a855f7', exercises: [
        { name: 'KH Hip Thrust', sets: '4 × 15 | KH 12,5 kg (beide)', gerat: '2 Kurzhanteln 12,5 kg auf Hüfte | Couch für Rückenabstützung', warum: 'Die beste Gesässübung. Gluteus maximus ist der stärkste Kniestabilisator. Stärkeres Gesäss = stabileres Knie beim Sprinten, Landen, Schiessen.', ausfuhrung: 'Oberer Rücken auf Couch, KH auf Hüfte (Handtuch unterlegen). Füsse hüftbreit flach. Hüfte explosiv hochdrücken bis gerade Linie Knie-Hüfte-Schulter. Oben 1 Sek. max. Gesäss anspannen.', tempo: 'HINAUF: explosiv — maximale Gesässkraft. HINUNTER: 3 Sek. langsam.' },
        { name: 'Single Leg Hip Thrust', sets: '3 × 12 je Bein | KH 12,5 kg', gerat: '1 Kurzhantel 12,5 kg | Couch', warum: 'Unilateral — deckt Kraft-Asymmetrien nach OP auf. Stärkt das operierte Bein gezielt.', ausfuhrung: 'Gleiche Position. Ein Fuss angehoben. Nur mit Standbein Hüfte hochdrücken.', tempo: 'KONTROLLIERT — langsam und bewusst, kein Ausgleich.' },
        { name: 'RDL — Rumänisches Kreuzheben', sets: '4 × 12 | KH 12,5 kg', gerat: '2 Kurzhanteln 12,5 kg', warum: 'Goldstandard für Hamstrings. Schützt das Knie indem es den Antagonisten stärkt. Schwache Hamstrings = hohes Knie-Verletzungsrisiko. In JEDEM Profi-Fussball-S&C-Programm.', ausfuhrung: 'Aufrecht. KH vor Oberschenkeln. Hüfte nach HINTEN schieben (nicht unten!). Rücken gerade. KH gleiten Beine entlang bis Dehnung in Hamstrings. Durch Gesäss zurückdrücken.', tempo: 'HINUNTER: 4 Sek. — exzentrische Phase ist WICHTIGSTER Teil. HINAUF: stark durch Gesäss und Hüfte.' },
        { name: 'Single Leg RDL', sets: '3 × 10 je Bein', gerat: '1 Kurzhantel oder Körpergewicht', warum: 'Kombination aus Hamstrings, Gleichgewicht und Propriozeption. Nervensystem lernt Knieführung — verhindert zukünftige Verletzungen.', ausfuhrung: 'Einbeinig. KH in gegenüberliegender Hand. Oberkörper nach vorne, freies Bein nach hinten — wie Flugzeug. Rücken gerade.', tempo: 'SEHR LANGSAM — 4 Sek. vor, 3 Sek. zurück. Technik vor Tempo.' },
        { name: 'Seitenausfallschritt', sets: '3 × 10 je Seite | KH 12,5 kg', gerat: '2 Kurzhanteln 12,5 kg', warum: 'Stärkt Adduktoren und Gesäss für seitliche Fussball-Bewegungen. Trainiert Knie in Frontalebene — wichtig für Richtungswechsel.', ausfuhrung: 'Grosser Schritt zur Seite. Gewicht auf seitlichem Bein, Knie beugt über Zehen. Anderes Bein gestreckt. Durch Ferse zurückdrücken.', tempo: 'HINUNTER: 3 Sek. HINAUF: stark.' },
        { name: 'Single Leg Calf Raise', sets: '3 × 20 je Bein', gerat: 'Körpergewicht / Stuhl zum Abstützen', warum: 'Starke Waden = bessere Stossdämpfung beim Laufen. Direkt mit Kniegesundheit verbunden.', ausfuhrung: 'Auf Stufe stehen. Auf Fussballen hochsteigen. Ferse frei absenken unter Stufenniveau.', tempo: 'HINAUF: explosiv. HINUNTER: 3–4 Sek. exzentrisch — stärkt Achillessehne.' },
      ],
    },
    {
      title: 'KNIESTABILISATION PROGRESSIV — 20 Min', color: '#22c55e', exercises: [
        { name: 'Lateral Step-up', sets: '3 × 12 je Seite', gerat: 'KG (Woche 1–2) / leichte KH (Woche 3–4)', warum: 'Seitliches Aufsteigen trainiert Gluteus medius spezifisch — kontrolliert das Knie beim Einbeinstand. Direkte Übertragung auf Fussball.', ausfuhrung: 'Seitlich zur Stufe. Fuss komplett draufstellen. Durch Ferse hochdrücken — Knie nicht nach innen!', tempo: 'WOCHE 1–2: kontrolliert. WOCHE 3–4: explosiv nach oben, kontrolliert runter.' },
        { name: 'Einbeiniges Gleichgewicht + Mini-Kniebeuge', sets: '3 × 30 Sek. je Bein', gerat: 'Körpergewicht | optional weiches Kissen', warum: 'Propriozeption nach Knie-OP stark beeinträchtigt. Ohne Training steigt Wiederholungsverletzungs-Risiko um 50%.', ausfuhrung: 'Einbeinig stehen, Knie leicht gebeugt. Fortschritt: Augen zu, oder auf weicher Fläche, oder Mini-Kniebeugen einbauen.', tempo: 'STATISCH und KONTROLLIERT.' },
      ],
    },
    KNIEPROTOKOLL,
  ],

  p1_4: [
    {
      title: 'AKTIVIERUNG — 10 Min', color: '#22c55e', exercises: [
        { name: 'Band Pull-Apart', sets: '3 × 20', gerat: 'Widerstandsband', warum: 'Aktiviert hintere Schulter vor Drückbelastung.', ausfuhrung: 'Wie Dienstag-Aktivierung.', tempo: 'KONTROLLIERT — 1 Sek. halten.' },
        { name: 'Band Face Pull', sets: '3 × 15', gerat: 'Band auf Kopfhöhe', warum: 'Schützt Schultergelenk.', ausfuhrung: 'Ellenbogen hochhalten, Hände neben Ohren.', tempo: 'LANGSAM.' },
        { name: 'TKE', sets: '2 × 20', gerat: 'Band am Türrahmen', warum: 'Tägliches Knie-Minimum.', ausfuhrung: 'Vollständig strecken, 2 Sek. halten.', tempo: 'KONTROLLIERT.' },
      ],
    },
    {
      title: 'HAUPTTRAINING — OBERKÖRPER DRÜCKEN 35 Min', color: '#3b82f6', exercises: [
        { name: 'KH Floor Press', sets: '4 × 12 | KH 12,5 kg', gerat: '2 Kurzhanteln 12,5 kg', warum: 'Brust, Schultern und Trizeps. Auf dem Boden limitiert der ROM — schützt Schultergelenke, ermöglicht hohes Gewicht sicher. Simuliert Druckkraft im Zweikampf.', ausfuhrung: 'Rücken auf Boden, Knie gebeugt. KH mit Übergriff. Ellenbogen 45° vom Körper. Absenken bis Oberarme Boden berühren. Explosiv drücken.', tempo: 'HINUNTER: 3 Sek. HINAUF: explosiv aus der Bodenposition.' },
        { name: 'KH Arnold Press', sets: '4 × 10 | KH 12,5 kg', gerat: '2 Kurzhanteln 12,5 kg', warum: 'Aktiviert alle drei Schulterköpfe in einer Übung durch Rotationsbewegung. Vollständigste Schulterübung mit KH.', ausfuhrung: 'KH auf Schulterhöhe, Handflächen zu dir. Drücken UND gleichzeitig nach aussen rotieren bis Handflächen nach vorne zeigen. Langsam zurück.', tempo: 'GLEICHMÄSSIG KONTROLLIERT — die Rotation ist der Kern der Übung.' },
        { name: 'Archer Push-up', sets: '3 × 8 je Seite', gerat: 'Körpergewicht', warum: 'Unilaterale Liegestütz-Variante — ein Arm trägt mehr Last. Schult Schulter-Koordination und seitliche Stabilität.', ausfuhrung: 'Liegestütz-Position, Hände breit. Zur Seite sinken — gebeugte Arm trägt Last, gestreckter Arm bleibt gestreckt.', tempo: 'SINKEN: 3–4 Sek. ZURÜCK: explosiv drücken.' },
        { name: 'KH Skull Crusher (Trizeps)', sets: '3 × 12 | KH 12,5 kg', gerat: '2 Kurzhanteln 12,5 kg', warum: 'Isoliert den Trizeps — macht 2/3 der Oberarmkraft aus. Entscheidend bei Pässen, Einwürfen und Zweikampfabwehr.', ausfuhrung: 'Rücken auf Boden. KH über Schultern. Nur aus Ellenbogen beugen — KH zur Stirn absenken. Ellenbogen zeigen nach oben.', tempo: 'ABSENKEN: 3 Sek. STRECKEN: explosiv.' },
        { name: 'KH Lateral Raise', sets: '3 × 15', gerat: '2 Kurzhanteln (leichter wenn möglich)', warum: 'Isoliert mittleren Deltoidkopf. Wichtig für Armpendel beim Laufen und Gleichgewicht.', ausfuhrung: 'Arme gestreckt seitlich hochheben bis Schulterhöhe. Daumen leicht nach unten kippen.', tempo: 'HINAUF: zügig. HINUNTER: 2–3 Sek. exzentrisch.' },
      ],
    },
    {
      title: 'TABATA KONDITION — 30 Min', color: '#f59e0b', exercises: [
        { name: '8 Runden | 20 Sek. Vollbelastung / 10 Sek. Pause', sets: '', gerat: 'KH 12,5 kg + Band', warum: 'HF-Ziel: 85–90%. Aerobe und anaerobe Ausdauer — Vorbereitung für Beep-Test und Yo-Yo.', ausfuhrung: '2 Min. Pause nach je 2 Runden.', tempo: 'MAXIMAL in den 20 Sek.' },
        { name: 'R 1+2: KH-Rudern beidhändig', sets: '20 Sek.', gerat: '', warum: 'Rücken, Bizeps', ausfuhrung: 'Explosiv ziehen', tempo: '' },
        { name: 'R 3+4: KH-Schulterdrücken', sets: '20 Sek.', gerat: '', warum: 'Schultern, Trizeps', ausfuhrung: 'Stark drücken', tempo: '' },
        { name: 'R 5+6: Goblet Kniebeuge (leicht)', sets: '20 Sek.', gerat: '', warum: 'Beine, Herz-Kreislauf', ausfuhrung: 'Zügig', tempo: '' },
        { name: 'R 7+8: KH-Bodendrücken', sets: '20 Sek.', gerat: '', warum: 'Brust, Schultern', ausfuhrung: 'Explosiv', tempo: '' },
      ],
    },
    {
      title: 'CORE — 15 Min', color: '#a855f7', exercises: [
        { name: 'Hollow Body Hold', sets: '3 × 30 Sek.', gerat: 'Matte', warum: 'Totale Core-Spannung.', ausfuhrung: 'Rücken auf Boden, Arme + Beine gestreckt leicht angehoben, Lendenwirbel am Boden.', tempo: 'STATISCH halten.' },
        { name: 'Bird Dog', sets: '3 × 10 je Seite', gerat: 'Matte', warum: 'Anti-Rotations-Stabilität auf Händen und Knien.', ausfuhrung: 'Vierfüssler. Gegenüber. Arm + Bein gleichzeitig strecken, 2 Sek. halten.', tempo: 'KONTROLLIERT — kein Schwingen.' },
        { name: 'Pallof Press', sets: '3 × 12 je Seite', gerat: 'Band seitlich', warum: 'Anti-Rotation.', ausfuhrung: 'Von Brust wegdrücken, 2 Sek. halten.', tempo: 'LANGSAM.' },
        { name: 'TKE', sets: '2 × 20', gerat: 'Band', warum: 'Tägliches Knie-Minimum.', ausfuhrung: 'Vollständig strecken.', tempo: 'KONTROLLIERT.' },
      ],
    },
  ],

  p1_5: [
    {
      title: 'BAND-AKTIVIERUNG — 12 Min', color: '#22c55e', exercises: [
        { name: 'TKE', sets: '3 × 20', gerat: 'Band', warum: '', ausfuhrung: '', tempo: 'Kontrolliert' },
        { name: 'Band Lateral Walk', sets: '3 × 15', gerat: 'Band', warum: '', ausfuhrung: '', tempo: 'Kontrolliert' },
        { name: 'Clamshell', sets: '2 × 15', gerat: 'Band', warum: '', ausfuhrung: '', tempo: 'Kontrolliert' },
        { name: 'Pull-Apart', sets: '2 × 20', gerat: 'Band', warum: '', ausfuhrung: '', tempo: 'Kontrolliert' },
        { name: 'Hip Circle', sets: '2 × 10', gerat: 'Körpergewicht', warum: '', ausfuhrung: '', tempo: 'Langsam' },
      ],
    },
    {
      title: 'HAUPTCIRCUIT — 5 Runden 55 Min', color: '#f59e0b', exercises: [
        { name: '60 Sek. Arbeit / 20 Sek. Wechsel / 2,5 Min. Pause nach jeder Runde', sets: '', gerat: '', warum: 'HF-Ziel: 80–90%. Cooper- und Beep-Test Herzfrequenzzone. Aerobe Basis ohne Laufen.', ausfuhrung: 'Alle 8 Übungen hintereinander.', tempo: '' },
        { name: '1. KH Hip Thrust', sets: '60 Sek.', gerat: 'KH 12,5 kg', warum: 'Gesäss + Explosivkraft', ausfuhrung: '', tempo: 'Explosiv hoch' },
        { name: '2. Decline Liegestütz', sets: '60 Sek.', gerat: 'Stuhl (Füsse oben)', warum: 'Brust + Schultern oberer Winkel', ausfuhrung: '', tempo: '3 Sek. runter, explosiv hoch' },
        { name: '3. KH Einarmiges Rudern (Wechsel)', sets: '60 Sek.', gerat: 'KH 12,5 kg', warum: 'Rücken + Bizeps unilateral', ausfuhrung: 'Seite wechseln nach 30 Sek.', tempo: 'Explosiv ziehen' },
        { name: '4. Band Seitgehen', sets: '60 Sek.', gerat: 'Band', warum: 'Gluteus medius — Kniestabilisierung', ausfuhrung: '', tempo: 'Kontrolliert' },
        { name: '5. KH Rumänisches Kreuzheben', sets: '60 Sek.', gerat: 'KH 12,5 kg', warum: 'Hamstrings — Knieschutz', ausfuhrung: '', tempo: '3 Sek. exzentrisch' },
        { name: '6. Pallof Press (schnell)', sets: '60 Sek.', gerat: 'Band', warum: 'Anti-Rotation Core unter Ermüdung', ausfuhrung: '', tempo: 'Zügig aber kontrolliert' },
        { name: '7. Step-up', sets: '60 Sek.', gerat: 'KG / leichte KH', warum: 'Knie progressiv + Propriozeption', ausfuhrung: 'Seite wechseln nach 30 Sek.', tempo: 'Kontrolliert' },
        { name: '8. KH Schulterdrücken', sets: '60 Sek.', gerat: 'KH 12,5 kg', warum: 'Schultern + HF hochhalten', ausfuhrung: '', tempo: 'Stark drücken' },
      ],
    },
    {
      title: 'FINISHER — 15 Min', color: '#ef4444', exercises: [
        { name: 'Farmers Walk', sets: '4 × 40 m', gerat: '2× KH 12,5 kg', warum: 'Griffkraft + Core + Kondition gleichzeitig. Professioneller Kraft-Ausdauer-Standard.', ausfuhrung: 'Aufrecht gehen — kein Schwingen. Schultern zurück, Blick geradeaus.', tempo: 'ZÜGIG aber kontrolliert.' },
        { name: 'Band-Rows Max', sets: '5 × 30/30 Sek.', gerat: 'Band', warum: 'HF bis zur letzten Sekunde hochhalten.', ausfuhrung: '30 Sek. maximales Tempo / 30 Sek. aktive Pause.', tempo: 'MAXIMAL in den 30 Sek.' },
      ],
    },
    KNIEPROTOKOLL,
  ],

  p1_6: [
    {
      title: 'SCHWIMMBAD SESSION — 95 Min', color: '#22c55e',
      note: 'WARUM SCHWIMMBAD? Wasser reduziert Körpergewicht um ~80%. Maximale Herzfrequenz trainierbar — identische Laufbewegung — ohne Gelenkbelastung. Jeder Profi-Verein nutzt Aqua-Jogging als primäres Reha-Konditionsmittel.',
      exercises: [
        { name: 'Aufwärmen', sets: '8 Min', gerat: 'Schwimmbad', warum: 'Durchblutung erhöhen, Körper auf Wassertemperatur anpassen.', ausfuhrung: '200 m Schwimmen (Kraul oder Rücken) — ruhiges Tempo.', tempo: 'LOCKER' },
        { name: 'Aqua-Jogging Basis', sets: '20 Min', gerat: 'Brusthöhes Wasser', warum: 'Identischer Laufschritt wie auf dem Feld — ohne Gelenkbelastung. Aufbaut aerobe Basis für Cooper-Test.', ausfuhrung: 'Normaler Laufschritt, Arme aktiv schwingen. Aufrecht — Fersen NICHT am Boden (schwebend).', tempo: 'ZONE 2 — HF 65–75%. Unterhaltung noch möglich.' },
        { name: 'Aqua-Intervalle', sets: '35 Min', gerat: 'Brusthöhes Wasser', warum: 'Trainiert exakt das Herzfrequenzmuster für Beep-Test und Yo-Yo. Maximaler Trainingsreiz ohne Kniebelastung.', ausfuhrung: '6 × 4 Min intensives Aqua-Jogging (Vollschritt, hohe Knie) / 90 Sek. Gehen im Wasser.', tempo: 'ZONE 3 — HF 80–88%. Sprechen nur noch mit Mühe möglich.' },
        { name: 'Oberkörper im Wasser', sets: '15 Min', gerat: 'Wasser als Widerstand', warum: 'Wasserwiederstand = konstante Spannung. Schultern + Rücken ohne Geräte trainieren.', ausfuhrung: 'Wasserwiderstands-Rudern 3×15 + Schulterdrücken 3×15 + seitliche Hiebe 3×15.', tempo: 'MITTEL — kontrollierte Bewegung gegen Wasserwiderstand.' },
        { name: 'Cooldown', sets: '10 Min', gerat: 'Schwimmbad', warum: '', ausfuhrung: 'Langsames Schwimmen 100 m + statisches Dehnen im Wasser (Hamstrings, Hüfte).', tempo: 'LOCKER' },
      ],
    },
    {
      title: 'KEIN SCHWIMMBAD? — Heim-Ersatz 90 Min', color: '#f59e0b',
      note: 'Wenn kein Zugang zum Schwimmbad möglich ist, diese Einheit als vollwertigen Ersatz ausführen.',
      exercises: [
        { name: 'Unterkörper A+B Mix', sets: '45 Min', gerat: 'KH 12,5 kg + Band', warum: 'Kombiniert die wichtigsten Übungen aus Montag und Mittwoch.', ausfuhrung: 'Hip Thrust 3×12 · RDL 3×10 · Goblet Squat 3×10 · Lateral Step-up 3×10 · Calf Raise 3×15', tempo: 'Kontrolliert' },
        { name: 'KH-Komplex Kondition', sets: '30 Min', gerat: 'KH 12,5 kg', warum: 'Ersatz für Ausdauer-Reiz des Schwimmbads. Hält HF bei 80–85%.', ausfuhrung: '4 Runden à 5 Übungen (RDL + Rudern + Drücken + Squat + Schulter) — KH nicht ablegen. 90 Sek. Pause.', tempo: 'Zügig' },
        { name: 'Knieprotokoll', sets: '12 Min', gerat: 'Band + Matte', warum: '', ausfuhrung: 'Wie täglich: TKE + Clamshell + Gleichgewicht + Dehnen.', tempo: '' },
      ],
    },
    KNIEPROTOKOLL,
  ],

  p1_0: [
    {
      title: 'AKTIVE ERHOLUNG — 60 Min', color: '#64748b',
      note: 'WARUM aktive statt passive Erholung? Leichte Bewegung fördert Durchblutung, baut Laktat ab, beschleunigt Regeneration. "Nur Liegen" verlangsamt die Erholung bei Profis.',
      exercises: [
        { name: 'Spaziergang — flaches Terrain', sets: '35–40 Min', gerat: 'Draussen', warum: 'Fördert Durchblutung ohne Belastung. Aktive Erholung > passive Erholung.', ausfuhrung: 'Normales Gehtempo. Kein Hügel, kein Laufen. Aufrechte Körperhaltung.', tempo: 'GEMÜTLICH — Erholung, kein Training.' },
        { name: 'Foam Roller — Ganzkörper', sets: '10 Min', gerat: 'Foam Roller', warum: 'Löst Verklebungen in der Faszie, verbessert Durchblutung und Beweglichkeit.', ausfuhrung: 'IT-Band, Quadrizeps, Hamstrings, Waden, oberer Rücken — 60 Sek. pro Muskelgruppe. Schmerzpunkte länger halten.', tempo: 'LANGSAM — auf Schmerzpunkten pausieren.' },
        { name: 'Statisches Dehnen', sets: '10 Min', gerat: 'Matte', warum: 'Erhält Beweglichkeit und verhindert Verkürzungen durch intensive Trainingswochen.', ausfuhrung: 'Hüftbeuger 45 Sek. · Quadrizeps 45 Sek. · Hamstrings 45 Sek. · Waden · Brustmuskeln. Jede Seite.', tempo: 'RUHIG — tief ausatmen, in Dehnung hineinfallen.' },
        { name: 'Eis / Wärme auf Knie', sets: '5–10 Min', gerat: 'Eis oder Wärmflasche', warum: 'Entzündungskontrolle nach intensiver Trainingswoche.', ausfuhrung: 'Knie warm oder geschwollen → 15 Min Eis. Kein Reiz → Wärme zur Durchblutungsförderung.', tempo: '' },
      ],
    },
    KNIEPROTOKOLL,
  ],

  p2_1: [
    {
      title: 'SCHWIMMBAD — Cooper-Vorbereitung 95 Min', color: '#22c55e', exercises: [
        { name: 'Aufwärmen', sets: '8 Min', gerat: 'Schwimmbad', warum: '', ausfuhrung: '200 m Kraul oder Rücken, ruhiges Tempo.', tempo: 'LOCKER' },
        { name: 'Aqua-Jogging Zone 2', sets: '20 Min', gerat: 'Brusthöhes Wasser', warum: 'Kontinuierliche Ausdauerbasis — exakt das Herz-Kreislauf-System wie beim Cooper 12-Min-Lauf.', ausfuhrung: 'Kontinuierliches Aqua-Jogging ohne Pause. Normaler Laufschritt, Arme aktiv.', tempo: 'HF 65–75% — gleichmässig.' },
        { name: 'Cooper-Vorbereitung Intervalle', sets: '35 Min', gerat: 'Brusthöhes Wasser', warum: 'Spezifische Vorbereitung für Cooper 12-Min-Lauf. Baut aerobe Kapazität (VO2max).', ausfuhrung: '8 × 3 Min intensives Aqua-Jogging (Vollschritt, hohe Knie) / 60 Sek. lockeres Gehen.', tempo: 'HF 80–88%.' },
        { name: 'Oberkörper im Wasser', sets: '15 Min', gerat: 'Wasser', warum: '', ausfuhrung: 'Rudern + Schulterdrücken + seitliche Hiebe, je 3 × 15.', tempo: 'Mittel' },
        { name: 'Cooldown + Dehnen', sets: '10 Min', gerat: '', warum: '', ausfuhrung: '100 m lockeres Schwimmen + Dehnen im Wasser.', tempo: 'LOCKER' },
      ],
    },
    {
      title: 'KEIN SCHWIMMBAD? — Heim-Ersatz', color: '#f59e0b', exercises: [
        { name: 'KH-Komplex Kondition', sets: '45 Min', gerat: 'KH 12,5 kg', warum: 'Aerober Ersatz-Reiz.', ausfuhrung: '5 Runden à 5 Übungen, KH nicht ablegen, 90 Sek. Pause. HF 80–85%.', tempo: 'Zügig' },
        { name: 'Band-Circuit', sets: '20 Min', gerat: 'Band', warum: '', ausfuhrung: 'Lateral Walk + Pull-Apart + Face Pull + Pallof Press — 3 Runden.', tempo: 'Kontrolliert' },
        { name: 'Knieprotokoll + Dehnen', sets: '15 Min', gerat: '', warum: '', ausfuhrung: 'Wie täglich.', tempo: '' },
      ],
    },
    KNIEPROTOKOLL,
  ],

  p2_2: [
    {
      title: 'GYM — BEINE + DRÜCKEN 100 Min', color: '#f97316', exercises: [
        { name: 'Aktivierung', sets: '12 Min', gerat: 'Band + Matte', warum: '', ausfuhrung: 'TKE 3×20 · Clamshell 3×15 · Band Lateral Walk 3×15 · Hip Circle 2×10', tempo: 'Kontrolliert' },
        { name: 'Beinpresse', sets: '4 × 12', gerat: 'Gym-Beinpresse', warum: 'Knie progressiv belasten mit kontrollierbarem Gewicht. Sicherer als Kniebeuge nach OP — kein freies Balancieren.', ausfuhrung: 'Fussposition schulterbreit. Gewicht progressiv steigern. Volle Kontrolle — 3 Sek. exzentrisch. Knie zeigen in Zehenrichtung.', tempo: 'HINUNTER: 3 Sek. HINAUF: kontrolliert stark.' },
        { name: 'Step-up mit KH', sets: '4 × 10 je Bein | KH 12,5 kg', gerat: '2 KH 12,5 kg | Stufe 30–40 cm', warum: 'Unilateral — stärkt operiertes Knie gezielt unter Last.', ausfuhrung: 'Seitlich zur Stufe. Fuss komplett drauf. Explosiv hochdrücken. 3 Sek. kontrolliert runter. Knie NICHT nach innen!', tempo: 'HINAUF: explosiv. HINUNTER: 3 Sek.' },
        { name: 'Bankdrücken (Gym-Stange oder KH)', sets: '4 × 10', gerat: 'Gym', warum: 'Brust + Trizeps + Schultern. Mehr Gewicht als Heimtraining möglich.', ausfuhrung: 'Schulterblätter zusammendrücken. 3 Sek. absenken bis Brust berührt. Explosiv drücken.', tempo: 'HINUNTER: 3 Sek. HINAUF: explosiv.' },
        { name: 'Core', sets: '15 Min', gerat: 'Matte + Band', warum: '', ausfuhrung: 'Pallof Press 3×12 · Dead Bug 3×10 · Hollow Body 3×30 Sek.', tempo: 'Kontrolliert' },
      ],
    },
    KNIEPROTOKOLL,
  ],

  p2_3: [
    {
      title: 'GYM — ZUG + POSTERIOR 100 Min', color: '#3b82f6', exercises: [
        { name: 'Aktivierung', sets: '12 Min', gerat: 'Band', warum: '', ausfuhrung: 'Pull-Apart 3×20 · Face Pull 3×15 · Clamshell 3×15', tempo: 'Kontrolliert' },
        { name: 'Langhantel-Rudern / KH-Rudern', sets: '4 × 10', gerat: 'Gym-Langhantel oder KH', warum: 'Latissimus, mittlerer Rücken, Bizeps. Mehr Gewicht = mehr Muskelreiz als Heimtraining.', ausfuhrung: 'Oberkörper 45° vorgebeugt. Mit Ellenbogen führen — zur Hüfte ziehen. Schulterblätter zusammen.', tempo: 'EXPLOSIV ziehen — 3–4 Sek. kontrolliert ablassen.' },
        { name: 'RDL — Rumänisches Kreuzheben', sets: '4 × 12', gerat: 'Gym-Langhantel oder KH', warum: 'Hamstrings Goldstandard. Knieschutz von hinten.', ausfuhrung: 'Hüfte nach hinten schieben. KH Beine entlang bis Dehnung spürbar. 4 Sek. exzentrisch.', tempo: 'HINUNTER: 4 Sek. — wichtigste Phase. HINAUF: durch Gesäss.' },
        { name: 'Nordic Curl (Nordisches Beinheben)', sets: '3 × 6–8', gerat: 'Partner oder Gym-Bank', warum: 'Stärkste exzentrische Hamstrings-Übung. Reduziert Hamstrings-Verletzungsrisiko um 51% laut Studien. Profi-Standard.', ausfuhrung: 'Knie auf Matte, Fersen fixiert. So langsam wie möglich nach vorne fallen. Hände fangen auf. Durch Hamstrings zurück (oder mit Händen abstossen).', tempo: 'SO LANGSAM WIE MÖGLICH — 5+ Sek. fallen ist das Ziel.' },
        { name: 'Face Pull + Pull-Apart Superset', sets: '3 × 15 je', gerat: 'Band / Kabelzug', warum: 'Schulter-Gesundheit. Gegenspieler zum Drücktraining.', ausfuhrung: 'Direkt hintereinander ohne Pause zwischen den Übungen.', tempo: 'Kontrolliert' },
        { name: 'Core', sets: '15 Min', gerat: 'Matte + Band', warum: '', ausfuhrung: 'Copenhagen Plank 3×20 Sek. · Bird Dog 3×10 · Pallof Press 3×12', tempo: 'Kontrolliert' },
      ],
    },
    KNIEPROTOKOLL,
  ],

  p2_4: [
    {
      title: 'ERHOLUNG + KNIE — 60 Min', color: '#64748b',
      note: 'Kein intensives Training heute. Aktive Regeneration und Kniepflege stehen im Vordergrund.',
      exercises: [
        { name: 'Foam Roller — Ganzkörper', sets: '15 Min', gerat: 'Foam Roller', warum: 'Abbau von Muskelspannung nach intensiven Gym-Tagen. Fördert Regeneration.', ausfuhrung: 'IT-Band · Quadrizeps · Hamstrings · Waden · oberer Rücken — je 60 Sek. pro Muskelgruppe.', tempo: 'LANGSAM — auf Schmerzpunkten pausieren.' },
        { name: 'Mobilitätsarbeit', sets: '15 Min', gerat: 'Matte', warum: 'Erhält Beweglichkeit und bereitet Knie auf intensive Gym-Tage vor.', ausfuhrung: 'Hüfte 90/90 · Weltrekord-Stretch · Thoraxrotation · Ankle Mobility (Knöchel-Kreise + Wand-Mobilisation)', tempo: 'LANGSAM und kontrolliert.' },
        { name: 'Statisches Dehnen', sets: '10 Min', gerat: 'Matte', warum: '', ausfuhrung: 'Hüftbeuger 45 Sek. · Quadrizeps 45 Sek. · Hamstrings 45 Sek. · Waden · Brustmuskeln.', tempo: 'RUHIG — tief ausatmen.' },
      ],
    },
    KNIEPROTOKOLL,
  ],

  p2_5: [
    {
      title: 'GYM — GANZKÖRPER POWER 100 Min', color: '#f97316', exercises: [
        { name: 'Aktivierung', sets: '12 Min', gerat: 'Band + Matte', warum: '', ausfuhrung: 'TKE · Clamshell · Pull-Apart · Hip Circle', tempo: 'Kontrolliert' },
        { name: 'Goblet Squat / Beinpresse', sets: '4 × 8', gerat: 'KH oder Gym-Beinpresse', warum: 'Kraft + Explosivität. Höheres Gewicht oder mehr Tempo als Phase 1.', ausfuhrung: 'Fokus auf maximale Explosivität nach oben. 3 Sek. kontrolliert runter.', tempo: 'HINAUF: EXPLOSIV. HINUNTER: 3 Sek.' },
        { name: 'KH Bankdrücken / Floor Press', sets: '4 × 10', gerat: 'KH oder Gym-Bank', warum: 'Brust + Trizeps Oberkörper-Kraft.', ausfuhrung: '3 Sek. absenken. Explosiv drücken.', tempo: 'Explosiv' },
        { name: 'Pull-ups / Lat-Pulldown', sets: '4 × 8', gerat: 'Gym', warum: 'Latissimus — stärkste Rückenübung. Wichtig für Zweikampfstärke.', ausfuhrung: 'Voller Bewegungsablauf — vollständig strecken unten, Kinn über Stange oben.', tempo: 'KONTROLLIERT — kein Schwingen.' },
        { name: 'Romanian Deadlift', sets: '3 × 10', gerat: 'Gym-Langhantel oder KH', warum: 'Hintere Kette Abschluss.', ausfuhrung: '4 Sek. exzentrisch — wie immer.', tempo: '4 Sek. runter' },
        { name: 'Konditionsfinisher', sets: '15 Min', gerat: 'KH oder Ruderergometer', warum: 'Aerober Abschluss — HF hochhalten.', ausfuhrung: 'Option A: KH-Komplex 3 Runden (RDL + Rudern + Drücken + Squat). Option B: Ruderergometer 3 × 3 Min / 1 Min Pause.', tempo: 'HF 80–85%' },
      ],
    },
    KNIEPROTOKOLL,
  ],

  p2_6: [
    {
      title: 'LAUFEN + GYM — 90 Min', color: '#22c55e',
      note: '⚠️ Laufeinheit NUR mit offizieller Physio-Freigabe! Ohne Freigabe → nur Gym-Teil ausführen.',
      exercises: [
        { name: 'Erste Laufeinheit (NUR mit Physio-Freigabe!)', sets: '20–25 Min', gerat: 'Flaches Terrain', warum: 'Erster Laufstimulus nach OP. Gehen-Laufen Methode schützt das Knie vor Überlastung.', ausfuhrung: 'Gehen-Laufen Intervalle: 2 Min gehen / 1 Min LANGSAM laufen. Auf Knie hören — bei jedem Schmerz SOFORT stoppen. Kein Hügel, kein hartes Terrain.', tempo: 'SEHR LANGSAM beim Laufen — Tempo ist egal. Schmerz = Stop.' },
        { name: 'Ohne Physio-Freigabe: Aqua-Jogging / Bike', sets: '25 Min', gerat: 'Schwimmbad oder Gym-Fahrrad', warum: 'Gleichwertiger aeroben Reiz ohne Laufbelastung.', ausfuhrung: 'Aqua-Jogging Intervalle wie Samstag ODER Gym-Fahrrad Zone 2 (60–70 Upm, Widerstand mittel).', tempo: 'HF 70–80%' },
        { name: 'Oberkörper Gym', sets: '40 Min', gerat: 'Gym', warum: 'Oberkörper-Erhalt während Lauf-Aufbau.', ausfuhrung: 'KH-Rudern 4×10 · Arnold Press 3×10 · Bizepscurl 3×12 · Skull Crusher 3×12 · Pull-Apart 3×20', tempo: 'Kontrolliert' },
        { name: 'Knieprotokoll + Eis', sets: '15 Min', gerat: 'Band + Matte + Eis', warum: 'Nach erster Laufeinheit Knie besonders beobachten!', ausfuhrung: 'TKE · Clamshell · Gleichgewicht. Danach: Eis auf Knie 15 Min wenn Wärme / leichte Schwellung spürbar.', tempo: 'Kontrolliert' },
      ],
    },
    KNIEPROTOKOLL,
  ],

  p2_0: [
    {
      title: 'AKTIVE ERHOLUNG — 60 Min', color: '#64748b', exercises: [
        { name: 'Spaziergang', sets: '35–40 Min', gerat: 'Draussen', warum: 'Aktive Regeneration fördert Durchblutung und Laktatabbau.', ausfuhrung: 'Flaches Terrain, normales Gehtempo. Kein Laufen.', tempo: 'GEMÜTLICH' },
        { name: 'Foam Roller', sets: '10 Min', gerat: 'Foam Roller', warum: '', ausfuhrung: 'Ganzkörper — IT-Band, Quad, Hamstrings, Waden, Rücken.', tempo: 'Langsam' },
        { name: 'Statisches Dehnen', sets: '10 Min', gerat: 'Matte', warum: '', ausfuhrung: 'Hüftbeuger · Quadrizeps · Hamstrings · Waden · Brust — je 45 Sek.', tempo: 'Ruhig, tief atmen' },
      ],
    },
    KNIEPROTOKOLL,
  ],
}

const WEEKS = [
  { week: 1, dates: '6.–8. Jun', label: 'Eingewöhnung', intensity: 60, color: '#22c55e' },
  { week: 2, dates: '9.–15. Jun', label: '+1 Satz, Tempo steigern', intensity: 75, color: '#f59e0b' },
  { week: 3, dates: '16.–22. Jun', label: 'Gym beginnt', intensity: 85, color: '#f97316' },
  { week: 4, dates: '23.–30. Jun', label: 'Test-Vorbereitung', intensity: 100, color: '#ef4444' },
]

const DAY_LABELS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
const MON_FIRST = [1, 2, 3, 4, 5, 6, 0]

function dKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getSessionInfo(date) {
  const m = date.getMonth()
  const d = date.getDate()
  const dow = date.getDay()
  if (m !== 5 || d < 6 || d > 30) return null
  const phase = d <= 16 ? 1 : 2
  const schedule = phase === 1 ? PHASE1 : PHASE2
  const week = d <= 8 ? 1 : d <= 15 ? 2 : d <= 22 ? 3 : 4
  return { session: schedule[dow], phase, week, program: PROGRAMS[`p${phase}_${dow}`] || null }
}

function ExerciseCard({ ex, color }) {
  const [open, setOpen] = useState(false)
  const hasDetail = ex.warum || ex.ausfuhrung
  return (
    <div style={{ borderBottom: '0.5px solid var(--card-border)', paddingBottom: 8, marginBottom: 8 }}>
      <div
        onClick={() => hasDetail && setOpen(p => !p)}
        style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: hasDetail ? 'pointer' : 'default' }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{ex.name}</div>
          {ex.gerat && <div style={{ fontSize: 10, color: 'var(--text-dimmer)', marginTop: 1 }}>Gerät: {ex.gerat}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {ex.sets && <span style={{ fontSize: 11, fontWeight: 700, color }}>{ex.sets}</span>}
          {hasDetail && (
            <div style={{ color: 'var(--text-dimmer)' }}>
              {open ? <CaretUp size={13} /> : <CaretDown size={13} />}
            </div>
          )}
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 8, paddingLeft: 4 }}>
          {ex.warum && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color, letterSpacing: '0.5px', marginBottom: 2 }}>WARUM</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>{ex.warum}</div>
            </div>
          )}
          {ex.ausfuhrung && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dimmer)', letterSpacing: '0.5px', marginBottom: 2 }}>AUSFÜHRUNG</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>{ex.ausfuhrung}</div>
            </div>
          )}
          {ex.tempo && (
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f97316', lineHeight: 1.4 }}>⏱ {ex.tempo}</div>
          )}
        </div>
      )}
    </div>
  )
}

function ProgramView({ program }) {
  return (
    <div style={{ marginTop: 12 }}>
      {program.map((section, si) => (
        <div key={si} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: section.color, letterSpacing: '0.8px', marginBottom: section.note ? 4 : 8, paddingBottom: 4, borderBottom: `1px solid ${section.color}25` }}>
            {section.title}
          </div>
          {section.note && (
            <div style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 8, fontStyle: 'italic' }}>{section.note}</div>
          )}
          {section.exercises.map((ex, ei) => (
            <ExerciseCard key={ei} ex={ex} color={section.color} />
          ))}
        </div>
      ))}
    </div>
  )
}

export default function TrainingPlanScreen() {
  const { setScreen } = useApp()
  const today = new Date()
  const [sessions, setSessions] = useState(loadRecoverySessions)
  const [flash, setFlash] = useState(null)
  const [showProgram, setShowProgram] = useState(false)

  const todayKey = dKey(today)
  const sessionMap = Object.fromEntries(sessions.map(s => [s.date, s]))
  const todayInfo = getSessionInfo(today)
  const todayDone = !!sessionMap[todayKey]

  const dow = today.getDay()
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + mondayOffset + i)
    const key = dKey(d)
    const info = getSessionInfo(d)
    return { d, key, label: DAY_LABELS[d.getDay()], dayNum: d.getDate(), session: info?.session || null, isToday: key === todayKey, isPast: d < today && key !== todayKey, done: !!sessionMap[key], inPlan: d.getMonth() === 5 && d.getDate() >= 6 && d.getDate() <= 30 }
  })

  const juneCompleted = sessions.filter(s => s.date.startsWith(`${PLAN_YEAR}-06-`) && parseInt(s.date.slice(8)) >= 6).length
  const totalDays = 25

  const currentWeek = WEEKS.find(w => {
    const d = today.getDate()
    if (w.week === 1) return d >= 6 && d <= 8
    if (w.week === 2) return d >= 9 && d <= 15
    if (w.week === 3) return d >= 16 && d <= 22
    return d >= 23 && d <= 30
  }) || WEEKS[0]

  function logSession(key, session) {
    if (sessionMap[key]) return
    const next = [...sessions.filter(s => s.date !== key), { date: key, type: session.type, duration: session.duration, pain: 0, notes: session.name }]
    setSessions(next)
    saveRecoverySessions(next)
    setFlash(key)
    setTimeout(() => setFlash(null), 2000)
  }

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div>
          <div className="screen-label">TRAINING</div>
          <div className="screen-title">Juni Trainingsplan</div>
          <div className="screen-sub">Reha + Konditionsaufbau | Profifussball</div>
        </div>
        {todayInfo && <span className="badge badge-accent">Phase {todayInfo.phase}</span>}
      </div>

      <div className="card" style={{ marginBottom: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.5px' }}>FORTSCHRITT JUNI</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{juneCompleted}/{totalDays}</span>
        </div>
        <div style={{ height: 5, background: 'var(--year-empty)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ height: '100%', width: `${Math.min(100, (juneCompleted / totalDays) * 100)}%`, background: 'var(--accent)', borderRadius: 3, transition: 'width 0.4s' }} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {WEEKS.map(w => (
            <div key={w.week} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: 3, borderRadius: 2, background: currentWeek.week >= w.week ? w.color : 'var(--year-empty)', marginBottom: 3 }} />
              <span style={{ fontSize: 8, fontWeight: currentWeek.week === w.week ? 800 : 400, color: currentWeek.week === w.week ? w.color : 'var(--text-dimmer)' }}>W{w.week}</span>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 5, fontSize: 10, color: 'var(--text-dim)' }}>
          {currentWeek.label} — <span style={{ color: currentWeek.color, fontWeight: 700 }}>{currentWeek.intensity}% Intensität</span>
        </div>
      </div>

      {todayInfo?.session ? (
        <div className="card slide-up" style={{ marginBottom: 12, borderLeft: `3px solid ${todayInfo.session.color}` }}>
          <div className="card-glow" />
          <div style={{ fontSize: 9, color: 'var(--text-dimmer)', letterSpacing: '1px', fontWeight: 700, marginBottom: 5 }}>
            HEUTE — {DAY_LABELS[today.getDay()].toUpperCase()}, {today.getDate()}.06
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: todayInfo.session.color, marginBottom: 3 }}>{todayInfo.session.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 10 }}>{todayInfo.session.focus}</div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock weight="fill" size={12} style={{ color: 'var(--text-dimmer)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{todayInfo.session.duration} Min</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} style={{ color: 'var(--text-dimmer)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{todayInfo.session.location}</span>
            </div>
          </div>
          {todayDone ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px', background: 'rgba(34,197,94,0.08)', borderRadius: 8, border: '0.5px solid rgba(34,197,94,0.25)', marginBottom: 10 }}>
              <CheckCircle size={15} style={{ color: '#22c55e' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>Heute erledigt</span>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              style={{ width: '100%', background: flash === todayKey ? '#22c55e' : todayInfo.session.color, border: 'none', transition: 'background 0.3s', marginBottom: 10 }}
              onClick={() => logSession(todayKey, todayInfo.session)}
            >
              {flash === todayKey ? '✓ Eingetragen!' : '✓ Heute erledigt'}
            </button>
          )}
          {todayInfo.program && (
            <>
              <button
                onClick={() => setShowProgram(p => !p)}
                style={{ width: '100%', background: 'none', border: '0.5px solid var(--card-border)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-dim)', fontSize: 12 }}
              >
                {showProgram ? <CaretUp size={14} /> : <CaretDown size={14} />}
                {showProgram ? 'Programm ausblenden' : 'Vollständiges Programm anzeigen'}
              </button>
              {showProgram && <ProgramView program={todayInfo.program} />}
            </>
          )}
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 12, textAlign: 'center', padding: '20px 14px' }}>
          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            {today.getMonth() !== 5 ? 'Plan gilt für Juni 2026' : today.getDate() < 6 ? 'Plan startet am 6. Juni' : 'Juni Plan abgeschlossen'}
          </div>
        </div>
      )}

      <div className="section-title">DIESE WOCHE</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 14 }}>
        {weekDays.map(day => (
          <div key={day.key} onClick={() => day.session && !day.done && (day.isToday || day.isPast) && day.inPlan && logSession(day.key, day.session)}
            style={{ textAlign: 'center', padding: '7px 2px', borderRadius: 10, background: day.isToday ? (day.session?.color || 'var(--accent)') + '18' : 'var(--card)', border: day.isToday ? `1.5px solid ${day.session?.color || 'var(--accent)'}` : '0.5px solid var(--card-border)', opacity: !day.inPlan ? 0.3 : 1, cursor: day.session && !day.done && (day.isToday || day.isPast) && day.inPlan ? 'pointer' : 'default' }}>
            <div style={{ fontSize: 9, color: 'var(--text-dimmer)', fontWeight: 600, marginBottom: 2 }}>{day.label}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: day.isToday ? (day.session?.color || 'var(--accent)') : 'var(--text)' }}>{day.dayNum}</div>
            {day.inPlan && day.session && <div style={{ width: 5, height: 5, borderRadius: '50%', margin: '3px auto 0', background: day.done ? '#22c55e' : day.session.color }} />}
          </div>
        ))}
      </div>

      <div className="section-title">PLAN ÜBERSICHT</div>
      {[{ label: 'Phase 1 — Heim', dates: '6.–16. Jun', schedule: PHASE1, color: '#22c55e' },
        { label: 'Phase 2 — Gym + Schwimmbad', dates: '17.–30. Jun', schedule: PHASE2, color: '#f97316' }].map(({ label, dates, schedule, color }) => (
        <div key={label} className="card" style={{ marginBottom: 8, borderLeft: `2px solid ${color}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color }}>{label}</span>
            <span style={{ fontSize: 10, color: 'var(--text-dimmer)' }}>{dates}</span>
          </div>
          {MON_FIRST.map(dow => {
            const s = schedule[dow]
            return (
              <div key={dow} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '0.5px solid var(--card-border)' }}>
                <span style={{ width: 22, fontSize: 10, fontWeight: 700, color: 'var(--text-dimmer)' }}>{DAY_LABELS[dow]}</span>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 11, color: 'var(--text-dim)' }}>{s.name}</span>
                <span style={{ fontSize: 10, color: 'var(--text-dimmer)' }}>{s.duration}m</span>
              </div>
            )
          })}
        </div>
      ))}

      <div className="section-title">KNIE-AMPEL — tägliche Selbstkontrolle</div>
      <div className="card" style={{ marginBottom: 14 }}>
        {KNIE_AMPEL.map(({ color, label, desc }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '0.5px solid var(--card-border)' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 2 }} />
            <div><span style={{ fontSize: 11, fontWeight: 700, color }}>{label} </span><span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{desc}</span></div>
          </div>
        ))}
      </div>

      <button className="btn btn-outline" style={{ width: '100%', marginBottom: 20 }} onClick={() => setScreen('recovery')}>
        → Heatmap öffnen
      </button>
    </div>
  )
}
