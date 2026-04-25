import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@mantine/core'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Upload from './pages/Upload'
import KnowledgeMap from './pages/KnowledgeMap'
import Diagnostic from './pages/Diagnostic'

function isLoggedIn() {
  const token = localStorage.getItem('token')
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (Date.now() > payload.exp * 1000) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return false
    }
    return true
  } catch {
    return false
  }
}

export default function App() {
  if (!isLoggedIn()) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <AppShell
        navbar={{ width: 220, breakpoint: 'sm' }}
        padding={0}
        style={{ height: '100vh' }}
      >
        <AppShell.Navbar>
          <Sidebar />
        </AppShell.Navbar>

        <AppShell.Main style={{ height: '100vh', overflow: 'hidden' }}>
          <Routes>
            <Route path="/"              element={<Navigate to="/knowledge-map" />} />
            <Route path="/knowledge-map" element={<KnowledgeMap />} />
            <Route path="/upload"        element={<Upload />} />
            <Route path="/diagnostic"    element={<Diagnostic />} />
            <Route path="/study"         element={<div style={{ padding: 20, color: 'white' }}>Study Mode — coming soon</div>} />
            <Route path="/progress"      element={<div style={{ padding: 20, color: 'white' }}>Progress — coming soon</div>} />
            <Route path="*"              element={<Navigate to="/knowledge-map" />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </BrowserRouter>
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