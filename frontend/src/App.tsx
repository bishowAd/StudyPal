import { useState } from 'react'
import Dungeon from './pages/Dungeon'
import './App.css'

type Mode = 'study' | 'game'

export default function App() {
  const [mode, setMode] = useState<Mode>('study')

  return (
    <div className="app-root">
      <nav className="app-nav">
        <div className="app-nav-brand">
          <span className="app-nav-logo">StudyPal</span>
          <span className="app-nav-tag">SLU</span>
        </div>
        <div className="mode-toggle" role="group" aria-label="App mode">
          <button
            className={`mode-btn ${mode === 'study' ? 'mode-btn-active' : ''}`}
            onClick={() => setMode('study')}
          >
            <span className="mode-icon">📚</span>
            Study
          </button>
          <button
            className={`mode-btn ${mode === 'game' ? 'mode-btn-active' : ''}`}
            onClick={() => setMode('game')}
          >
            <span className="mode-icon">⚔️</span>
            Game
          </button>
        </div>
      </nav>
      <main className="app-main">
        {mode === 'study' ? (
          <div className="study-placeholder">
            <div className="study-placeholder-icon">📖</div>
            <h2>Study Mode</h2>
            <p>Chat, Notes, Quiz, and Flashcards coming here.</p>
            <p className="study-placeholder-hint">
              Switch to <strong>Game</strong> mode to try Knowledge Dungeon →
            </p>
          </div>
        ) : (
          <Dungeon />
        )}
      </main>
    </div>
  )
}