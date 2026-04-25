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
  )
}