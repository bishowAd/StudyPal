import { Box, Text, NavLink, Button } from '@mantine/core'
import { useNavigate, useLocation } from 'react-router-dom'

const links = [
  { path: '/upload',     icon: '📤', label: 'Upload Notes'   },
  { path: '/',           icon: '🗺️', label: 'Knowledge Map'  },
  { path: '/diagnostic', icon: '🎯', label: 'Diagnostic Quiz' },
  { path: '/study',      icon: '📚', label: 'Study Mode'      },
  { path: '/progress',   icon: '📈', label: 'My Progress'     },
]
export default function Sidebar() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const user      = JSON.parse(localStorage.getItem('user') || '{}')

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/'
  }

  return (
    <Box h="100%" bg="dark.8"
      style={{ borderRight: '1px solid var(--mantine-color-dark-6)' }}>

      <Box p="md"
        style={{ borderBottom: '1px solid var(--mantine-color-dark-6)' }}>
        <Text fw={700} size="lg">
          Study<Text span c="violet.4" fw={700}>Pal</Text>
        </Text>
        <Text size="xs" c="dimmed" mt={2}>Knowledge Gap Detector</Text>
      </Box>

      <Box p="sm">
        {links.map(link => (
          <NavLink
            key={link.path}
            label={link.label}
            leftSection={<span style={{ fontSize: 15 }}>{link.icon}</span>}
            active={location.pathname === link.path}
            onClick={() => navigate(link.path)}
            style={{ borderRadius: 'var(--mantine-radius-md)' }}
            mb={2}
          />
        ))}
      </Box>

      <Box
        pos="absolute" bottom={0} left={0} right={0} p="md"
        style={{ borderTop: '1px solid var(--mantine-color-dark-6)' }}
      >
        <Text size="xs" fw={500} truncate>{user.username || 'Student'}</Text>
        <Text size="xs" c="dimmed" truncate mb={8}>{user.email || ''}</Text>
        <Button
          size="xs" variant="subtle" color="red"
          fullWidth onClick={logout}
        >
          Log out
        </Button>
      </Box>
    </Box>
  )
}