import { useState, useEffect, useRef, useCallback } from 'react'
import './Dungeon.css'

// ── Types ──────────────────────────────────────────────────────────────────
interface BattleRoom {
  type: 'battle'
  monster_name: string
  question: string
  options: string[]
  correct_index: number
  explanation: string
}
interface TreasureRoom {
  type: 'treasure'
  concept: string
  fun_fact: string
  bonus_xp: number
}
interface BossRoom {
  type: 'boss'
  boss_name: string
  boss_intro: string
  question: string
  options: string[]
  correct_index: number
  explanation: string
  bonus_xp: number
}
type Room = BattleRoom | TreasureRoom | BossRoom
interface Dungeon { floor_title: string; rooms: Room[] }

// ── SVG assets ─────────────────────────────────────────────────────────────
const PLAYER_SVG = `<svg viewBox="0 0 64 96" width="58" height="88" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="4" width="24" height="10" rx="3" fill="#1A5632"/>
  <rect x="16" y="12" width="32" height="20" rx="3" fill="#1A5632"/>
  <rect x="20" y="17" width="24" height="7" rx="1" fill="#0d2e1c"/>
  <rect x="14" y="12" width="10" height="18" rx="2" fill="#1A5632"/>
  <rect x="40" y="12" width="10" height="18" rx="2" fill="#1A5632"/>
  <path d="M4 14 L12 14 L14 30 L8 36 Z" fill="#FFC629"/>
  <line x1="8" y1="14" x2="8" y2="36" stroke="#e6b000" stroke-width="1.5"/>
  <line x1="4" y1="24" x2="12" y2="24" stroke="#e6b000" stroke-width="1.5"/>
  <rect x="54" y="2" width="5" height="42" rx="2" fill="#c8d0c0"/>
  <rect x="46" y="16" width="15" height="4" rx="1" fill="#FFC629"/>
  <rect x="16" y="30" width="32" height="8" rx="2" fill="#0d2e1c"/>
  <rect x="28" y="31" width="8" height="6" rx="1" fill="#FFC629"/>
  <rect x="16" y="38" width="13" height="26" rx="3" fill="#1A5632"/>
  <rect x="35" y="38" width="13" height="26" rx="3" fill="#1A5632"/>
  <rect x="14" y="61" width="17" height="9" rx="3" fill="#0d2e1c"/>
  <rect x="33" y="61" width="17" height="9" rx="3" fill="#0d2e1c"/>
</svg>`

const MONSTERS = [
  // Ghost scholar
  `<svg viewBox="0 0 100 115" width="100" height="110" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 58 Q16 12 50 10 Q84 12 84 58 L84 112 Q72 100 62 112 Q52 100 50 112 Q48 100 38 112 Q28 100 16 112 Z" fill="#2a6b44"/>
    <path d="M22 62 Q22 22 50 20 Q78 22 78 62 L78 102 Q69 94 62 102 Q55 94 50 102 Q45 94 38 102 Q31 94 22 102 Z" fill="#1A5632" opacity=".5"/>
    <ellipse cx="36" cy="54" rx="11" ry="13" fill="#0a1f12"/>
    <ellipse cx="64" cy="54" rx="11" ry="13" fill="#0a1f12"/>
    <ellipse cx="39" cy="51" rx="4" ry="4.5" fill="#FFC629" opacity=".9"/>
    <ellipse cx="67" cy="51" rx="4" ry="4.5" fill="#FFC629" opacity=".9"/>
    <path d="M34 74 L40 68 L50 74 L60 68 L66 74" stroke="#0a1f12" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="55" y="62" width="32" height="24" rx="3" fill="#f0ead0" transform="rotate(-8 55 62)"/>
    <line x1="60" y1="69" x2="78" y2="66" stroke="#c03030" stroke-width="2" transform="rotate(-8 60 69)"/>
    <line x1="60" y1="75" x2="78" y2="72" stroke="#c03030" stroke-width="2" transform="rotate(-8 60 75)"/>
    <text x="63" y="82" font-size="7" fill="#c03030" transform="rotate(-8 63 82)" font-family="monospace" font-weight="bold">WRONG</text>
  </svg>`,
  // Slime
  `<svg viewBox="0 0 100 115" width="100" height="110" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="sg2" cx="38%" cy="30%"><stop offset="0%" stop-color="#3a8c58"/><stop offset="100%" stop-color="#1A5632"/></radialGradient></defs>
    <ellipse cx="50" cy="75" rx="42" ry="32" fill="url(#sg2)"/>
    <ellipse cx="32" cy="65" rx="11" ry="13" fill="#0a1f12"/>
    <ellipse cx="68" cy="65" rx="11" ry="13" fill="#0a1f12"/>
    <ellipse cx="34" cy="68" rx="7" ry="8" fill="#0a1f12"/>
    <ellipse cx="70" cy="68" rx="7" ry="8" fill="#0a1f12"/>
    <circle cx="37" cy="65" r="2.5" fill="#FFC629" opacity=".8"/>
    <circle cx="73" cy="65" r="2.5" fill="#FFC629" opacity=".8"/>
    <path d="M 38 86 Q 50 97 62 86" stroke="#0a1f12" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="24" cy="101" rx="7" ry="9" fill="#236b40"/>
    <ellipse cx="75" cy="99" rx="5" ry="8" fill="#236b40"/>
    <ellipse cx="50" cy="105" rx="4" ry="6" fill="#236b40"/>
  </svg>`,
  // Skeleton
  `<svg viewBox="0 0 100 130" width="95" height="115" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="37" rx="24" ry="23" fill="#d0cbb8"/>
    <ellipse cx="39" cy="34" rx="8.5" ry="9.5" fill="#0a1f12"/>
    <ellipse cx="61" cy="34" rx="8.5" ry="9.5" fill="#0a1f12"/>
    <ellipse cx="41" cy="32" rx="3" ry="3.5" fill="#FFC629" opacity=".7"/>
    <ellipse cx="63" cy="32" rx="3" ry="3.5" fill="#FFC629" opacity=".7"/>
    <path d="M 45 46 L 50 52 L 55 46 Z" fill="#0a1f12"/>
    <rect x="38" y="53" width="5.5" height="7" rx="1" fill="#0a1f12"/>
    <rect x="47" y="53" width="5.5" height="7" rx="1" fill="#0a1f12"/>
    <rect x="56" y="53" width="5.5" height="7" rx="1" fill="#0a1f12"/>
    <rect x="28" y="68" width="44" height="38" rx="3" fill="#c0bba8"/>
    <path d="M34 79 Q50 74 66 79" stroke="#a09888" stroke-width="2" fill="none"/>
    <path d="M34 89 Q50 84 66 89" stroke="#a09888" stroke-width="2" fill="none"/>
    <rect x="14" y="68" width="15" height="30" rx="4" fill="#c0bba8"/>
    <rect x="71" y="68" width="15" height="30" rx="4" fill="#c0bba8"/>
    <rect x="68" y="45" width="5" height="38" rx="2" fill="#7a5418" transform="rotate(18 68 45)"/>
    <polygon points="78,34 84,49 74,49" fill="#cc2020" transform="rotate(18 78 34)"/>
    <rect x="26" y="105" width="12" height="20" rx="3" fill="#c0bba8"/>
    <rect x="62" y="105" width="12" height="20" rx="3" fill="#c0bba8"/>
  </svg>`,
]

const BOSS_SVG = `<svg viewBox="0 0 130 148" width="128" height="140" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 76 L0 14 L42 58 Z" fill="#0d3320"/>
  <path d="M118 76 L130 14 L88 58 Z" fill="#0d3320"/>
  <path d="M65 132 Q96 144 114 126 Q124 116 110 108" stroke="#0d3320" stroke-width="9" fill="none" stroke-linecap="round"/>
  <polygon points="110,100 124,114 102,116" fill="#1A5632"/>
  <ellipse cx="65" cy="112" rx="38" ry="34" fill="#1A5632"/>
  <ellipse cx="65" cy="50" rx="27" ry="25" fill="#236b40"/>
  <path d="M44 26 L30 2 L50 22" fill="#0d3320"/>
  <path d="M86 26 L100 2 L80 22" fill="#0d3320"/>
  <ellipse cx="52" cy="46" rx="11" ry="12" fill="#FFC629"/>
  <ellipse cx="78" cy="46" rx="11" ry="12" fill="#FFC629"/>
  <ellipse cx="54" cy="48" rx="6" ry="7" fill="#e6b000"/>
  <ellipse cx="80" cy="48" rx="6" ry="7" fill="#e6b000"/>
  <ellipse cx="55" cy="50" rx="3" ry="3.5" fill="#0a0a00"/>
  <ellipse cx="81" cy="50" rx="3" ry="3.5" fill="#0a0a00"/>
  <path d="M44 72 Q65 82 86 72" stroke="#0d3320" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <polygon points="50,72 53,80 56,72" fill="#f0e0b0"/>
  <polygon points="61,74 64,82 67,74" fill="#f0e0b0"/>
  <polygon points="72,74 75,82 78,74" fill="#f0e0b0"/>
  <rect x="72" y="90" width="32" height="26" rx="3" fill="#1e0e04" transform="rotate(-16 72 90)"/>
  <rect x="74" y="92" width="28" height="22" rx="2" fill="#e8d0a0" transform="rotate(-16 74 92)"/>
  <text x="82" y="107" font-family="serif" font-size="7" font-style="italic" fill="#8b0000" transform="rotate(-16 82 107)" font-weight="bold">WRONG</text>
</svg>`

const CHEST_SVG = `<svg viewBox="0 0 120 88" width="140" height="103" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="60" cy="86" rx="52" ry="6" fill="#000" opacity=".3"/>
  <rect x="8" y="48" width="104" height="36" rx="5" fill="#1A5632"/>
  <rect x="52" y="48" width="16" height="36" rx="2" fill="#0d2e1c"/>
  <circle cx="16" cy="60" r="4" fill="#FFC629"/>
  <circle cx="104" cy="60" r="4" fill="#FFC629"/>
  <circle cx="16" cy="76" r="4" fill="#FFC629"/>
  <circle cx="104" cy="76" r="4" fill="#FFC629"/>
  <path d="M8 48 Q8 8 60 6 Q112 8 112 48 Z" fill="#236b40"/>
  <rect x="42" y="40" width="36" height="20" rx="4" fill="#0d2e1c"/>
  <rect x="46" y="44" width="28" height="16" rx="3" fill="#FFC629"/>
  <circle cx="60" cy="52" r="5" fill="#0d2e1c"/>
  <circle cx="60" cy="52" r="3" fill="#e6b000"/>
</svg>`

// ── Constants ──────────────────────────────────────────────────────────────
const MAX_HP = 5
const MAX_XP = 220
const XP_BATTLE = 40
const DEMO_NOTES = {
  'Cell Biology': `Cell structure: Prokaryotic cells lack a nucleus; eukaryotic cells have a membrane-bound nucleus.
Mitochondria produce ATP via oxidative phosphorylation in the inner mitochondrial membrane.
Rough ER has ribosomes and synthesizes proteins; smooth ER synthesizes lipids.
Golgi apparatus packages and ships proteins. Chloroplasts perform photosynthesis.
Photosynthesis: Light reactions in thylakoid split water, release O2, produce ATP and NADPH.
Calvin cycle in stroma fixes CO2 into glucose. Cellular respiration: Glycolysis converts glucose
to pyruvate (2 ATP). Krebs cycle in mitochondrial matrix. ETC produces ~32 ATP. Cell division:
Mitosis = two identical diploid cells. Meiosis = four haploid unique cells. S phase = DNA replication.
Cell membrane = phospholipid bilayer. Active transport uses ATP against concentration gradient.`,
  'Python OOP': `Classes: blueprint for objects. Instances: objects created from a class.
__init__ = constructor. self = current instance. Encapsulation: bundling data + methods.
__name (double underscore) = name mangling, private. _name (single) = convention for private.
Inheritance: class Child(Parent). super() calls parent. Multiple inheritance via C3 linearization (MRO).
Polymorphism: same method name, different behavior in subclasses. Duck typing: checks behavior not type.
Dunders: __str__ human string, __repr__ dev string, __len__ for len(), __add__ for +, __eq__ for ==.
Class attributes: shared by all instances. Instance attributes: unique per object.
@classmethod gets cls. @staticmethod gets no implicit arg. Abstract classes: abc module, cannot instantiate.`,
  'French Revolution': `Causes: France bankrupt after American Revolution funding + royal extravagance.
Estates: First=clergy, Second=nobility, Third=97% population bearing tax burden.
Enlightenment (Rousseau, Voltaire) challenged divine right. Bad harvests spiked bread prices.
Events: Estates-General 1789. Third Estate → National Assembly. Tennis Court Oath = constitution pledge.
Bastille stormed July 14 1789 = symbolic start. Declaration of Rights of Man = liberty equality fraternity.
Reign of Terror 1793-94: Robespierre + Committee of Public Safety, 16000+ guillotined.
Thermidorian Reaction ended Terror; Robespierre executed July 1794.
Louis XVI executed Jan 1793. Marie Antoinette Oct 1793. Napoleon → First Consul → Emperor.
Outcomes: feudalism abolished, nationalism spread, absolute monarchy ended.`,
}

type GameScreen = 'select' | 'loading' | 'playing' | 'gameover'

interface FloatMsg { id: number; text: string; color: string; x: number; y: number }
interface Particle { id: number; x: number; y: number; vx: number; vy: number; color: string; size: number; life: number }

// ── Component ──────────────────────────────────────────────────────────────
export default function Dungeon() {
  const [screen, setScreen] = useState<GameScreen>('select')
  const [topic, setTopic] = useState('')
  const [dungeon, setDungeon] = useState<Dungeon | null>(null)
  const [roomIdx, setRoomIdx] = useState(0)
  const [hp, setHp] = useState(MAX_HP)
  const [xp, setXp] = useState(0)
  const [sel, setSel] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [result, setResult] = useState<'win' | 'lose' | null>(null)
  const [animating, setAnimating] = useState(false)
  const [floats, setFloats] = useState<FloatMsg[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [monAnim, setMonAnim] = useState('')
  const [playerAnim, setPlayerAnim] = useState('')
  const [sceneShake, setSceneShake] = useState(false)
  const [monHpPct, setMonHpPct] = useState(100)
  const [displayedClaim, setDisplayedClaim] = useState('')
  const twRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const floatCounter = useRef(0)

  const currentRoom = dungeon?.rooms[roomIdx]
  const hpPct = Math.round((hp / MAX_HP) * 100)
  const xpPct = Math.round(Math.min(xp / MAX_XP, 1) * 100)
  const hpColor = hp <= 1 ? '#cc2020' : hp <= 2 ? '#cc7020' : '#1A5632'

  // Typewriter for question text
  useEffect(() => {
    if (!currentRoom || screen !== 'playing' || revealed) return
    if (currentRoom.type === 'treasure') return
    const text = currentRoom.question
    setDisplayedClaim('')
    if (twRef.current) clearInterval(twRef.current)
    let i = 0
    twRef.current = setInterval(() => {
      setDisplayedClaim(text.slice(0, i + 1))
      i++
      if (i >= text.length) { clearInterval(twRef.current!); twRef.current = null }
    }, 22)
    return () => { if (twRef.current) clearInterval(twRef.current) }
  }, [roomIdx, screen, revealed])

  const addFloat = useCallback((text: string, color: string, x = 55, y = 60) => {
    const id = ++floatCounter.current
    setFloats(f => [...f, { id, text, color, x, y }])
    setTimeout(() => setFloats(f => f.filter(m => m.id !== id)), 1300)
  }, [])

  const spawnParticles = useCallback((x: number, y: number, colors: string[]) => {
    const newP: Particle[] = Array.from({ length: 16 }, (_, i) => ({
      id: Date.now() + i,
      x, y,
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -10 - 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 5,
      life: 1,
    }))
    setParticles(p => [...p, ...newP])
    setTimeout(() => setParticles(p => p.filter(pt => !newP.find(n => n.id === pt.id))), 900)
  }, [])

  const triggerAnim = (target: 'mon' | 'player', anim: string) => {
    if (target === 'mon') { setMonAnim(''); requestAnimationFrame(() => setMonAnim(anim)) }
    else { setPlayerAnim(''); requestAnimationFrame(() => setPlayerAnim(anim)) }
  }

  async function loadDungeon(t: string) {
    setTopic(t)
    setScreen('loading')
    setDungeon(null)
    setRoomIdx(0); setHp(MAX_HP); setXp(0)
    setSel(null); setRevealed(false); setResult(null)
    setAnimating(false); setMonHpPct(100); setDisplayedClaim('')

    const token = localStorage.getItem('token')
    const notesText = DEMO_NOTES[t as keyof typeof DEMO_NOTES] || ''

    try {
      const res = await fetch('http://localhost:5000/api/games/dungeon/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ notes_text: notesText, topic: t }),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data: Dungeon = await res.json()
      setDungeon(data)
      setScreen('playing')
    } catch (e) {
      console.error(e)
      setScreen('select')
    }
  }

  function answer(i: number) {
    if (animating || revealed || !currentRoom) return
    if (currentRoom.type === 'treasure') return
    setAnimating(true)
    setSel(i)
    const room = currentRoom as BattleRoom | BossRoom
    const correct = i === room.correct_index
    const xpGain = room.type === 'boss' ? (room.bonus_xp ?? 50) : XP_BATTLE

    if (correct) {
      triggerAnim('player', 'kd-player-attack')
      setTimeout(() => {
        triggerAnim('mon', 'kd-mon-hit')
        setMonHpPct(0)
        spawnParticles(68, 45, ['#FFC629', '#fff', '#1A5632', '#e6b000', '#a0e080'])
        addFloat('CORRECT!', '#FFC629', 18, 35)
        addFloat(`+${xpGain} XP`, '#90e890', 22, 58)
        setXp(v => v + xpGain)
        setTimeout(() => {
          triggerAnim('mon', 'kd-mon-death')
          setTimeout(() => { setRevealed(true); setAnimating(false) }, 700)
        }, 380)
      }, 300)
    } else {
      triggerAnim('mon', 'kd-mon-attack')
      setTimeout(() => {
        setSceneShake(true); setTimeout(() => setSceneShake(false), 500)
        triggerAnim('player', 'kd-player-hurt')
        addFloat('WRONG!', '#ff5555', 18, 35)
        addFloat('-1 HP', '#ff9090', 22, 58)
        setHp(v => {
          const next = Math.max(0, v - 1)
          if (next === 0) setTimeout(() => { setResult('lose'); setScreen('gameover') }, 1200)
          return next
        })
        setTimeout(() => { setRevealed(true); setAnimating(false) }, 480)
      }, 320)
    }
  }

  function claimTreasure(bonus: number) { setXp(v => v + bonus); nextRoom() }

  function nextRoom() {
    if (!dungeon) return
    if (roomIdx >= dungeon.rooms.length - 1) { setResult('win'); setScreen('gameover'); return }
    setRoomIdx(r => r + 1)
    setSel(null); setRevealed(false); setMonHpPct(100); setAnimating(false); setDisplayedClaim('')
    setMonAnim(''); setPlayerAnim('')
  }

  // ── Scene ────────────────────────────────────────────────────────────────
  const BattleScene = ({ monSvg, monName, isBoss }: { monSvg: string; monName: string; isBoss: boolean }) => (
    <div className={`kd-scene ${isBoss ? 'kd-scene-boss' : ''} ${sceneShake ? 'kd-shake' : ''}`}>
      {/* Stars */}
      <div className="kd-stars" aria-hidden="true">
        {Array.from({ length: 30 }, (_, i) => (
          <div key={i} className="kd-star" style={{
            left: `${(i * 37 + 7) % 100}%`, top: `${(i * 53 + 11) % 75}%`,
            width: `${(i % 3) + 1}px`, height: `${(i % 3) + 1}px`,
            animationDelay: `${(i % 5) * 0.4}s`,
          }} />
        ))}
      </div>
      {/* Torches */}
      <div className="kd-torch kd-torch-l"><div className="kd-flame"/><div className="kd-torch-body"/><div className="kd-torch-base"/></div>
      <div className="kd-torch kd-torch-r"><div className="kd-flame"/><div className="kd-torch-body"/><div className="kd-torch-base"/></div>
      {/* Ground */}
      <div className="kd-ground"/>
      {/* Player */}
      <div className="kd-unit kd-player-unit">
        <span className="kd-unit-label">YOU</span>
        <div className="kd-hp-bar-sm"><div className="kd-hp-fill-sm" style={{ width: `${hpPct}%`, background: hpColor }}/></div>
        <div className={`kd-player-spr ${playerAnim}`} dangerouslySetInnerHTML={{ __html: PLAYER_SVG }}/>
      </div>
      {/* Monster */}
      <div className="kd-unit kd-mon-unit">
        <span className="kd-unit-label" style={{ color: isBoss ? '#FFC629' : '#90c8a0' }}>
          {monName.toUpperCase()}
        </span>
        <div className="kd-hp-bar-sm"><div className="kd-mon-hp-fill" style={{ width: `${monHpPct}%`, transition: 'width .5s ease' }}/></div>
        <div className={`kd-mon-spr ${monAnim}`} dangerouslySetInnerHTML={{ __html: monSvg }}/>
        <div className="kd-mon-shadow"/>
      </div>
      {/* Floats */}
      {floats.map(f => (
        <div key={f.id} className="kd-float" style={{ left: `${f.x}%`, top: `${f.y}%`, color: f.color }}>
          {f.text}
        </div>
      ))}
      {/* Particles */}
      {particles.map(p => (
        <div key={p.id} className="kd-particle" style={{
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size, background: p.color,
        }}/>
      ))}
    </div>
  )

  // ── Screens ──────────────────────────────────────────────────────────────
  if (screen === 'select') return (
    <div className="kd-root">
      <div className="kd-panel">
        <div className="kd-select-header">
          <div className="kd-logo">KNOWLEDGE<br/>DUNGEON</div>
          <p className="kd-logo-sub">AI-POWERED STUDY RPG</p>
          <p className="kd-select-desc">
            Battle monsters spreading misconceptions. Answer correctly to defeat them and clear the floor.
          </p>
        </div>
        <div className="kd-select-body">
          <div className="kd-section-label">CHOOSE YOUR DUNGEON</div>
          {Object.keys(DEMO_NOTES).map(t => (
            <button key={t} className="kd-topic-btn" onClick={() => loadDungeon(t)}>
              <div className="kd-topic-info">
                <span className="kd-topic-name">{t}</span>
                <span className="kd-topic-desc">5 rooms · battle · boss</span>
              </div>
              <span className="kd-topic-arrow">▶</span>
            </button>
          ))}
          <p className="kd-hint">In the full app, dungeons generate from your uploaded notes.</p>
        </div>
      </div>
    </div>
  )

  if (screen === 'loading') return (
    <div className="kd-root">
      <div className="kd-panel kd-loading">
        <div className="kd-load-logo">KNOWLEDGE DUNGEON</div>
        <div className="kd-load-dots"><span/><span/><span/></div>
        <p className="kd-load-text">GENERATING DUNGEON...</p>
        <p className="kd-load-sub">Gemini is forging rooms from your <strong>{topic}</strong> notes</p>
        <div className="kd-load-bar"><div className="kd-load-fill"/></div>
      </div>
    </div>
  )

  if (screen === 'gameover') return (
    <div className="kd-root">
      <div className={`kd-panel kd-over ${result === 'win' ? 'kd-over-win' : 'kd-over-lose'}`}>
        <div className="kd-over-bg">{result === 'win' ? 'VICTORY' : 'DEFEAT'}</div>
        <div className={`kd-over-title ${result === 'win' ? 'kd-win-txt' : 'kd-lose-txt'}`}>
          {result === 'win' ? 'VICTORY!' : 'DEFEATED'}
        </div>
        <p className="kd-over-sub">
          {result === 'win'
            ? <>You conquered <strong>{dungeon?.floor_title}</strong> with {hp}/{MAX_HP} HP remaining.</>
            : <>You fell in room {roomIdx + 1} of {dungeon?.rooms.length}. Study up and return.</>}
        </p>
        <div className="kd-over-xp">{xp}</div>
        <div className="kd-over-xp-lbl">XP EARNED</div>
        <div className="kd-over-btns">
          <button className="kd-btn" onClick={() => loadDungeon(topic)}>RETRY</button>
          <button className="kd-btn" onClick={() => setScreen('select')}>NEW DUNGEON</button>
        </div>
      </div>
    </div>
  )

  if (!currentRoom) return null

  // ── HUD ───────────────────────────────────────────────────────────────────
  const roomType = currentRoom.type
  const HUD = () => (
    <div className="kd-hud">
      <span className="kd-hud-lbl kd-hp-lbl">HP</span>
      <div className="kd-bar kd-hp-bar-main">
        <div className="kd-hp-fill-main" style={{ width: `${hpPct}%`, background: hpColor }}/>
      </div>
      <span className="kd-hud-num">{hp}/{MAX_HP}</span>
      <span className="kd-hud-lbl kd-xp-lbl" style={{ marginLeft: 10 }}>XP</span>
      <div className="kd-bar kd-xp-bar">
        <div className="kd-xp-fill" style={{ width: `${xpPct}%` }}/>
      </div>
      <span className="kd-hud-num">{xp}</span>
      <div className={`kd-room-tag ${roomType === 'boss' ? 'kd-tag-boss' : roomType === 'treasure' ? 'kd-tag-treasure' : 'kd-tag-battle'}`}>
        {roomType.toUpperCase()} {roomIdx + 1}/{dungeon?.rooms.length}
      </div>
    </div>
  )

  // ── Treasure room ─────────────────────────────────────────────────────────
  if (currentRoom.type === 'treasure') {
    const r = currentRoom
    return (
      <div className="kd-root">
        <div className="kd-panel kd-panel-gold">
          <HUD/>
          <div className="kd-treasure-scene">
            <div className="kd-treasure-glow"/>
            {[{ top: '20%', left: '20%', delay: '0s' }, { top: '30%', right: '22%', delay: '.5s' },
              { top: '15%', left: '50%', delay: '.9s' }, { top: '50%', left: '30%', delay: '1.3s' }].map((s, i) => (
              <div key={i} className="kd-sparkle" style={s as React.CSSProperties}/>
            ))}
            <div className="kd-chest-wrap" dangerouslySetInnerHTML={{ __html: CHEST_SVG }}/>
          </div>
          <div className="kd-dialog kd-dialog-gold">
            <div className="kd-dialog-header" style={{ color: '#FFC629' }}>★ TREASURE ROOM ★</div>
            <div className="kd-treasure-concept">{r.concept}</div>
            <div className="kd-treasure-fact">{r.fun_fact}</div>
            <div className="kd-treasure-xp">+{r.bonus_xp} XP BONUS</div>
            <button className="kd-next-btn kd-next-gold" onClick={() => claimTreasure(r.bonus_xp)}>
              COLLECT &amp; CONTINUE ▶▶
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Battle / Boss room ────────────────────────────────────────────────────
  const isBoss = currentRoom.type === 'boss'
  const room = currentRoom as BattleRoom | BossRoom
  const monIdx = roomIdx % MONSTERS.length
  const KEYS = ['A', 'B', 'C', 'D']

  return (
    <div className="kd-root">
      <div className={`kd-panel ${isBoss ? 'kd-panel-boss' : ''}`}>
        <HUD/>
        <BattleScene
          monSvg={isBoss ? BOSS_SVG : MONSTERS[monIdx]}
          monName={isBoss ? (room as BossRoom).boss_name : (room as BattleRoom).monster_name}
          isBoss={isBoss}
        />
        {/* Dialog box */}
        <div className={`kd-dialog ${isBoss ? 'kd-dialog-boss' : ''}`}>
          {isBoss && <div className="kd-boss-announce">☠ FINAL BOSS ☠</div>}
          {isBoss && <div className="kd-boss-intro">{(room as BossRoom).boss_intro}</div>}
          <div className="kd-dialog-header">
            ▶ {isBoss ? (room as BossRoom).boss_name.toUpperCase() : (room as BattleRoom).monster_name.toUpperCase()}
          </div>
          <div className="kd-claim">
            {revealed ? room.question : displayedClaim}
            {!revealed && <span className="kd-cursor">█</span>}
          </div>
        </div>
        {/* Options */}
        <div className="kd-opts">
          {room.options.map((opt, i) => {
            let cls = 'kd-opt'
            if (revealed) {
              cls += ' kd-locked'
              if (i === room.correct_index) cls += ' kd-correct'
              else if (i === sel) cls += ' kd-wrong'
              else cls += ' kd-neutral'
            }
            return (
              <button key={i} className={cls} onClick={() => answer(i)}>
                <span className="kd-opt-key">{KEYS[i]}</span>
                {opt}
              </button>
            )
          })}
        </div>
        {/* Explanation */}
        {revealed && (
          <div className="kd-exp">
            <div className="kd-exp-header">▶ VERDICT</div>
            <div className="kd-exp-body">{room.explanation}</div>
            {hp > 0 && (
              <button className={`kd-next-btn ${isBoss ? 'kd-next-boss' : ''}`} onClick={nextRoom}>
                {roomIdx === (dungeon?.rooms.length ?? 0) - 1 ? 'COMPLETE FLOOR ▶▶' : 'NEXT ROOM ▶▶'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}