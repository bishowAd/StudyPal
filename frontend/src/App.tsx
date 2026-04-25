import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@mantine/core'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Upload from './pages/Upload'
import KnowledgeMap from './pages/KnowledgeMap'
import Diagnostic from './pages/Diagnostic'
import { useState } from 'react'
import Dungeon from './pages/Dungeon'
import ProgressPage from './pages/ProgressPage'
import './App.css'

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

type Mode = 'study' | 'game'

export default function App() {
  const [mode, setMode] = useState<Mode>('study')

  // 1. If not logged in, only show the Login route
  if (!isLoggedIn()) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    )
  }

  // 2. If logged in, show the App with the Mode Toggle
  return (
    <BrowserRouter>
      <div className="app-root" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        
        {/* Top Navigation (From Version 2) */}
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

        {/* Main Content Area */}
        <main className="app-main" style={{ flex: 1, overflow: 'hidden' }}>
          {mode === 'study' ? (
            
            /* --- STUDY MODE: Mantine Layout & Routing (From Version 1) --- */
            <AppShell
              navbar={{ width: 220, breakpoint: 'sm' }}
              padding={0}
              style={{ height: '100%' }}
            >
              <AppShell.Navbar>
                <Sidebar />
              </AppShell.Navbar>

              <AppShell.Main style={{ height: '100%', overflow: 'hidden' }}>
                <Routes>
                  <Route path="/" element={<Navigate to="/knowledge-map" />} />
                  <Route path="/knowledge-map" element={<KnowledgeMap />} />
                  <Route path="/upload" element={<Upload />} />
                  <Route path="/diagnostic" element={<Diagnostic />} />
                  <Route path="/study" element={<div style={{ padding: 20, color: 'white' }}>Study Mode — coming soon</div>} />
                 <Route path="/progress" element={<ProgressPage />} />
                  <Route path="*" element={<Navigate to="/knowledge-map" />} />
                </Routes>
              </AppShell.Main>
            </AppShell>

          ) : (
            
            /* --- GAME MODE: Dungeon Component (From Version 2) --- */
            <Dungeon />
            
          )}
        </main>
      </div>
    </BrowserRouter>
  )
}