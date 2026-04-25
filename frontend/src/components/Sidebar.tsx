import { Box, Text, Button } from '@mantine/core'
import { useNavigate, useLocation } from 'react-router-dom'

const links = [
  { path: '/upload',        icon: '📤', label: 'Upload Notes'   },
  { path: '/knowledge-map', icon: '🗺️', label: 'Knowledge Map'  },
  { path: '/diagnostic',    icon: '🎯', label: 'Diagnostic Quiz' },
  { path: '/study',         icon: '📚', label: 'Study Mode'      },
  { path: '/progress',      icon: '📈', label: 'My Progress'     },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user     = JSON.parse(localStorage.getItem('user') || '{}')

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/'
  }

  return (
    <Box h="100%" style={{
      background:   '#0a1a0f',
      borderRight:  '1px solid rgba(0,99,65,0.3)',
      display:      'flex',
      flexDirection:'column',
    }}>

      {/* Logo */}
      <Box px="md" py="lg" style={{
        borderBottom: '1px solid rgba(0,99,65,0.3)',
        flexShrink:   0,
      }}>
        <Text fw={800} size="xl" style={{ letterSpacing: '-0.5px' }}>
          <Text span style={{ color: '#ffffff' }}>Study</Text>
          <Text span style={{ color: '#F2A900' }}>Pal</Text>
        </Text>
        <Text size="xs" style={{ color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
          Knowledge Gap Detector
        </Text>
      </Box>

      {/* Nav links */}
      <Box p="sm" style={{ flex: 1 }}>
        {links.map(link => {
          const isActive = location.pathname === link.path ||
            (link.path === '/knowledge-map' && location.pathname === '/')
          return (
            <Box
              key={link.path}
              onClick={() => navigate(link.path)}
              mb={4}
              px="sm" py="xs"
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          10,
                borderRadius: 8,
                cursor:       'pointer',
                background:   isActive ? 'rgba(0,99,65,0.3)'   : 'transparent',
                border:       isActive ? '1px solid rgba(0,99,65,0.5)' : '1px solid transparent',
                transition:   'all .15s',
              }}
              onMouseEnter={e => {
                if (!isActive)(e.currentTarget as HTMLElement).style.background = 'rgba(0,99,65,0.15)'
              }}
              onMouseLeave={e => {
                if (!isActive)(e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              <span style={{ fontSize: 16 }}>{link.icon}</span>
              <Text size="sm" fw={isActive ? 600 : 400} style={{
                color: isActive ? '#ffffff' : 'rgba(255,255,255,0.55)',
              }}>
                {link.label}
              </Text>
              {isActive && (
                <Box ml="auto" w={4} h={4} style={{
                  borderRadius: '50%',
                  background:   '#F2A900',
                  flexShrink:   0,
                }}/>
              )}
            </Box>
          )
        })}
      </Box>

      {/* User + logout */}
      <Box px="md" py="md" style={{
        borderTop: '1px solid rgba(0,99,65,0.3)',
        flexShrink: 0,
      }}>
        <Box mb={8} px="sm" py="xs" style={{
          background:   'rgba(0,99,65,0.1)',
          border:       '1px solid rgba(0,99,65,0.2)',
          borderRadius: 8,
        }}>
          <Text size="xs" fw={600} c="white" truncate>
            {user.username || 'Student'}
          </Text>
          <Text size="xs" style={{ color: 'rgba(255,255,255,0.35)' }} truncate>
            {user.email || ''}
          </Text>
        </Box>
        <Button
          size="xs" fullWidth radius="md"
          onClick={logout}
          style={{
            background: 'rgba(255,77,77,0.1)',
            border:     '1px solid rgba(255,77,77,0.2)',
            color:      'rgba(255,120,120,0.8)',
            fontWeight: 500,
          }}
        >
          Log out
        </Button>
      </Box>

    </Box>
  )
}