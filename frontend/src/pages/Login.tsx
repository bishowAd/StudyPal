import { useState } from 'react'
import {
  Box, Paper, Text, TextInput,
  PasswordInput, Button, Stack,
  Group, Anchor, Alert
} from '@mantine/core'
import { useNavigate } from 'react-router-dom'

type Mode = 'login' | 'register'

export default function Login() {
  const [mode,     setMode]     = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const navigate = useNavigate()

  const submit = async () => {
    setError('')

    if (!email || !password) {
      setError('Email and password are required')
      return
    }
    if (mode === 'register' && !username) {
      setError('Username is required')
      return
    }

    setLoading(true)

    try {
      const url  = mode === 'login'
        ? 'http://localhost:5000/api/auth/login'
        : 'http://localhost:5000/api/auth/register'

      const body = mode === 'login'
        ? { email, password }
        : { username, email, password }

      const res  = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Something went wrong')
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user',  JSON.stringify(data.user))
      navigate('/')
      window.location.reload()

    } catch {
      setError('Could not reach the server. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box style={{
      height:          '100vh',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      background:      '#0a1a0f',
    }}>

      {/* background glow */}
      <Box style={{
        position:  'fixed',
        top:       '-20%',
        left:      '-20%',
        width:     '60%',
        height:    '60%',
        background:'radial-gradient(circle, rgba(0,99,65,0.3) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <Box style={{
        position:  'fixed',
        bottom:    '-20%',
        right:     '-20%',
        width:     '60%',
        height:    '60%',
        background:'radial-gradient(circle, rgba(242,169,0,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <Paper
        p={40}
        radius="lg"
        w={420}
        style={{
          background:   'rgba(10, 26, 15, 0.9)',
          border:       '1px solid rgba(0, 99, 65, 0.4)',
          backdropFilter: 'blur(20px)',
          position:     'relative',
          zIndex:       1,
        }}
      >
        {/* logo */}
        <Box ta="center" mb={32}>
          <Box
            mx="auto"
            mb={16}
            style={{
              width:           64,
              height:          64,
              borderRadius:    16,
              background:      'linear-gradient(135deg, #006341, #00855a)',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              fontSize:        28,
              boxShadow:       '0 8px 32px rgba(0,99,65,0.4)',
            }}
          >
            🎓
          </Box>
          <Text fw={800} size="xl" style={{ color: '#ffffff', letterSpacing: '-0.5px' }}>
            Study<Text span style={{ color: '#F2A900' }} fw={800}>Pal</Text>
          </Text>
          <Text size="xs" mt={4} style={{ color: 'rgba(255,255,255,0.5)' }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </Text>
        </Box>

        <Stack gap="md">
          {error && (
            <Alert
              radius="md"
              py="xs"
              style={{
                background: 'rgba(220,38,38,0.1)',
                border:     '1px solid rgba(220,38,38,0.3)',
              }}
            >
              <Text size="sm" c="red.4">{error}</Text>
            </Alert>
          )}

          {mode === 'register' && (
            <Box>
              <Text size="xs" fw={500} mb={6}
                style={{ color: 'rgba(255,255,255,0.7)' }}>
                Username
              </Text>
              <TextInput
                placeholder="yourname"
                value={username}
                onChange={e => setUsername(e.currentTarget.value)}
                radius="md"
                styles={{
                  input: {
                    background:  'rgba(255,255,255,0.05)',
                    border:      '1px solid rgba(0,99,65,0.4)',
                    color:       '#ffffff',
                    '&:focus': {
                      border: '1px solid #006341',
                    },
                  },
                }}
              />
            </Box>
          )}

          <Box>
            <Text size="xs" fw={500} mb={6}
              style={{ color: 'rgba(255,255,255,0.7)' }}>
              Email
            </Text>
            <TextInput
              placeholder="you@selu.edu"
              value={email}
              onChange={e => setEmail(e.currentTarget.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              radius="md"
              styles={{
                input: {
                  background: 'rgba(255,255,255,0.05)',
                  border:     '1px solid rgba(0,99,65,0.4)',
                  color:      '#ffffff',
                },
              }}
            />
          </Box>

          <Box>
            <Text size="xs" fw={500} mb={6}
              style={{ color: 'rgba(255,255,255,0.7)' }}>
              Password
            </Text>
            <PasswordInput
              placeholder={
                mode === 'register'
                  ? 'At least 6 characters'
                  : 'Your password'
              }
              value={password}
              onChange={e => setPassword(e.currentTarget.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              radius="md"
              styles={{
                input: {
                  background: 'rgba(255,255,255,0.05)',
                  border:     '1px solid rgba(0,99,65,0.4)',
                  color:      '#ffffff',
                },
              }}
            />
          </Box>

          <Button
            fullWidth
            radius="md"
            size="md"
            mt={4}
            loading={loading}
            onClick={submit}
            style={{
              background:  'linear-gradient(135deg, #006341, #00855a)',
              border:      'none',
              fontWeight:  600,
              letterSpacing: '0.3px',
              boxShadow:   '0 4px 20px rgba(0,99,65,0.4)',
            }}
          >
            {mode === 'login' ? 'Log in' : 'Create account'}
          </Button>

          {/* gold divider */}
          <Box style={{
            display:    'flex',
            alignItems: 'center',
            gap:        12,
          }}>
            <Box style={{ flex: 1, height: 1, background: 'rgba(242,169,0,0.2)' }} />
            <Text size="xs" style={{ color: 'rgba(255,255,255,0.3)' }}>or</Text>
            <Box style={{ flex: 1, height: 1, background: 'rgba(242,169,0,0.2)' }} />
          </Box>

          <Group justify="center">
            <Text size="sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {mode === 'login'
                ? "Don't have an account?"
                : 'Already have an account?'}
            </Text>
            <Anchor
              size="sm"
              style={{ color: '#F2A900', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError('')
              }}
            >
              {mode === 'login' ? 'Register' : 'Log in'}
            </Anchor>
          </Group>

        </Stack>

        {/* bottom tag */}
        <Text size="xs" ta="center" mt={24}
          style={{ color: 'rgba(255,255,255,0.2)' }}>
        </Text>
      </Paper>
    </Box>
  )
}