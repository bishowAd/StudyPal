import { useState } from 'react'
import './Flashcards.css'

interface Flashcard { front: string; back: string }
interface Deck { deck_title: string; flashcards: Flashcard[] }

interface Props { subjectId: number }

export default function Flashcards({ subjectId }: Props) {
  const [deck, setDeck] = useState<Deck | null>(null)
  const [loading, setLoading] = useState(false)
  const [cardIdx, setCardIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Set<number>>(new Set())
  const [review, setReview] = useState<Set<number>>(new Set())
  const [count, setCount] = useState(10)
  const [done, setDone] = useState(false)

  async function generate() {
    setLoading(true)
    setDeck(null)
    setCardIdx(0)
    setFlipped(false)
    setKnown(new Set())
    setReview(new Set())
    setDone(false)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('http://localhost:5000/api/games/flashcards/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ subject_id: subjectId, count }),
      })
      const data: Deck = await res.json()
      setDeck(data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  function markKnown() {
    setKnown(s => new Set([...s, cardIdx]))
    setReview(s => { const n = new Set(s); n.delete(cardIdx); return n })
    next()
  }

  function markReview() {
    setReview(s => new Set([...s, cardIdx]))
    setKnown(s => { const n = new Set(s); n.delete(cardIdx); return n })
    next()
  }

  function next() {
    if (!deck) return
    if (cardIdx < deck.flashcards.length - 1) {
      setCardIdx(i => i + 1)
      setFlipped(false)
    } else {
      setDone(true)
    }
  }

  function prev() {
    if (cardIdx > 0) {
      setCardIdx(i => i - 1)
      setFlipped(false)
    }
  }

  // ── Generate screen ────────────────────────────────────────────
  if (!deck && !loading) return (
    <div className="fc-root">
      <div className="fc-setup">
        <div className="fc-setup-title">FLASHCARD DECK</div>
        <p className="fc-setup-sub">Generate flashcards from your uploaded notes using AI.</p>
        <div className="fc-count-row">
          <span className="fc-count-label">CARDS</span>
          {[5, 10, 15, 20].map(n => (
            <button
              key={n}
              className={`fc-count-btn ${count === n ? 'fc-count-active' : ''}`}
              onClick={() => setCount(n)}
            >{n}</button>
          ))}
        </div>
        <button className="fc-gen-btn" onClick={generate}>GENERATE FLASHCARDS ▶</button>
      </div>
    </div>
  )

  // ── Loading ────────────────────────────────────────────────────
  if (loading) return (
    <div className="fc-root">
      <div className="fc-loading">
        <div className="fc-load-dots"><span/><span/><span/></div>
        <p className="fc-load-txt">GENERATING DECK...</p>
        <p className="fc-load-sub">AI is creating flashcards from your notes</p>
        <div className="fc-load-bar"><div className="fc-load-fill"/></div>
      </div>
    </div>
  )

  // ── Done screen ────────────────────────────────────────────────
  if (done && deck) return (
    <div className="fc-root">
      <div className="fc-done">
        <div className="fc-done-title">DECK COMPLETE!</div>
        <p className="fc-done-sub">{deck.deck_title}</p>
        <div className="fc-done-stats">
          <div className="fc-stat fc-stat-known">
            <div className="fc-stat-num">{known.size}</div>
            <div className="fc-stat-lbl">GOT IT</div>
          </div>
          <div className="fc-stat fc-stat-review">
            <div className="fc-stat-num">{review.size}</div>
            <div className="fc-stat-lbl">REVIEW</div>
          </div>
          <div className="fc-stat">
            <div className="fc-stat-num">{deck.flashcards.length - known.size - review.size}</div>
            <div className="fc-stat-lbl">SKIPPED</div>
          </div>
        </div>
        <div className="fc-done-btns">
          {review.size > 0 && (
            <button className="fc-btn" onClick={() => {
              setCardIdx(0); setFlipped(false); setDone(false)
            }}>STUDY AGAIN</button>
          )}
          <button className="fc-btn" onClick={generate}>NEW DECK</button>
        </div>
      </div>
    </div>
  )

  if (!deck) return null
  const card = deck.flashcards[cardIdx]
  const pct = Math.round(((cardIdx) / deck.flashcards.length) * 100)

  // ── Card screen ────────────────────────────────────────────────
  return (
    <div className="fc-root">
      {/* Header */}
      <div className="fc-header">
        <span className="fc-deck-title">{deck.deck_title.toUpperCase()}</span>
        <span className="fc-progress-txt">{cardIdx + 1} / {deck.flashcards.length}</span>
      </div>

      {/* Progress bar */}
      <div className="fc-progress-bar">
        <div className="fc-progress-fill" style={{ width: `${pct}%` }}/>
      </div>

      {/* Pill indicators */}
      <div className="fc-pills">
        {deck.flashcards.map((_, i) => (
          <div
            key={i}
            className={`fc-pill ${i === cardIdx ? 'fc-pill-current' : known.has(i) ? 'fc-pill-known' : review.has(i) ? 'fc-pill-review' : ''}`}
          />
        ))}
      </div>

      {/* Flip card */}
      <div className={`fc-card-wrap ${flipped ? 'fc-flipped' : ''}`} onClick={() => setFlipped(f => !f)}>
        <div className="fc-card">
          <div className="fc-card-front">
            <div className="fc-card-tag">QUESTION</div>
            <div className="fc-card-text">{card.front}</div>
            <div className="fc-card-hint">tap to reveal</div>
          </div>
          <div className="fc-card-back">
            <div className="fc-card-tag" style={{ color: '#FFC629', borderColor: '#FFC629' }}>ANSWER</div>
            <div className="fc-card-text">{card.back}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {flipped ? (
        <div className="fc-actions">
          <button className="fc-action-btn fc-btn-review" onClick={markReview}>
            😅 NEED REVIEW
          </button>
          <button className="fc-action-btn fc-btn-known" onClick={markKnown}>
            ✅ GOT IT
          </button>
        </div>
      ) : (
        <div className="fc-actions">
          <button className="fc-nav-btn" onClick={prev} disabled={cardIdx === 0}>← PREV</button>
          <button className="fc-nav-btn" onClick={next}>SKIP →</button>
        </div>
      )}
    </div>
  )
}