import { useState, useEffect } from 'react'
import Flashcards from './Flashcards'
import Dungeon from './Dungeon'
import './StudyMode.css'

type SubMode = 'flashcards' | 'game'

interface Subject {
  id: number
  title: string
  topic_count: number
  created_at: string
}

export default function StudyMode() {
  const [subMode, setSubMode] = useState<SubMode>('flashcards')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('http://localhost:5000/api/upload/', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const list: Subject[] = data.subjects || []
        setSubjects(list)
        if (list.length > 0) setSelectedId(list[0].id)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="sm-root">
      {/* Sub-mode toggle */}
      <div className="sm-topbar">
        <div className="sm-toggle">
          <button
            className={`sm-btn ${subMode === 'flashcards' ? 'sm-btn-active' : ''}`}
            onClick={() => setSubMode('flashcards')}
          >
            <span>🃏</span> Flashcards
          </button>
          <button
            className={`sm-btn ${subMode === 'game' ? 'sm-btn-active' : ''}`}
            onClick={() => setSubMode('game')}
          >
            <span>⚔️</span> Game
          </button>
        </div>

        {/* Subject picker */}
        {!loading && subjects.length > 0 && (
          <div className="sm-picker">
            <label className="sm-picker-label">NOTES</label>
            <select
              className="sm-select"
              value={selectedId ?? ''}
              onChange={e => setSelectedId(Number(e.target.value))}
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        )}

      </div>

      {/* Content */}
      <div className="sm-content">
        {loading ? (
          <div className="sm-empty">
            <div className="sm-empty-icon">⏳</div>
            <p>Loading your notes...</p>
          </div>
        ) : subjects.length === 0 ? (
          <div className="sm-empty">
            <div className="sm-empty-icon">📂</div>
            <p>No notes uploaded yet.</p>
            <p className="sm-empty-hint">Go to <strong>Upload Notes</strong> to get started.</p>
          </div>
        ) : subMode === 'flashcards' ? (
          <Flashcards subjectId={selectedId!} />
        ) : (
          <Dungeon subjectId={selectedId!} />
        )}
      </div>
    </div>
  )
}