import { useEffect, useState } from 'react'
import {
  Box, Text, Paper, Button, Stack, Group,
  Badge, ScrollArea, Flex, Loader, RingProgress,
  SimpleGrid, Accordion
} from '@mantine/core'

const getToken = () => localStorage.getItem('token')

interface Topic {
  id:     number
  name:   string
  status: string
  score:  number
}

interface SubjectProgress {
  subject_id: number
  title:      string
  created_at: string
  total:      number
  tested:     number
  strong:     number
  medium:     number
  weak:       number
  unknown:    number
  score:      number
  topics:     Topic[]
}

const STATUS_COLOR: Record<string, string> = {
  strong:  '#00c97a',
  medium:  '#F2A900',
  weak:    '#ff4d4d',
  unknown: 'rgba(255,255,255,0.2)',
}

const STATUS_BG: Record<string, string> = {
  strong:  'rgba(0,201,122,0.15)',
  medium:  'rgba(242,169,0,0.15)',
  weak:    'rgba(255,77,77,0.15)',
  unknown: 'rgba(255,255,255,0.05)',
}

export default function ProgressPage() {
  const [progress, setProgress] = useState<SubjectProgress[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    fetch('http://localhost:5000/api/progress/', {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(d => setProgress(d.progress || []))
      .catch(() => setError('Could not load progress'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <Flex h="100vh" align="center" justify="center" direction="column" gap="md">
      <Loader size="md" color="#006341" />
      <Text size="sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Loading your progress...</Text>
    </Flex>
  )

  if (error) return (
    <Flex h="100vh" align="center" justify="center">
      <Text size="sm" c="red.4">{error}</Text>
    </Flex>
  )

  const totalTopics  = progress.reduce((s, p) => s + p.total,   0)
  const totalStrong  = progress.reduce((s, p) => s + p.strong,  0)
  const totalMedium  = progress.reduce((s, p) => s + p.medium,  0)
  const totalWeak    = progress.reduce((s, p) => s + p.weak,    0)
  const totalUnknown = progress.reduce((s, p) => s + p.unknown, 0)
  const totalTested  = progress.reduce((s, p) => s + p.tested,  0)
  const overallScore = totalTopics > 0
    ? Math.round((totalStrong * 100 + totalMedium * 60) / totalTopics)
    : 0

  return (
    <Flex direction="column" h="100vh">

      {/* Header */}
      <Box px="md" py="sm" style={{
        borderBottom:   '1px solid rgba(0,99,65,0.3)',
        flexShrink:     0,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <Text fw={600} size="sm" c="white">My Progress</Text>
          <Text size="xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {progress.length} subjects · {totalTopics} topics tracked
          </Text>
        </div>
        <Button size="xs" radius="md"
          style={{
            background: 'linear-gradient(135deg, #006341, #00855a)',
            border:     'none',
            fontWeight: 600,
          }}
          onClick={() => window.location.href = '/knowledge-map'}>
          Take Diagnostic →
        </Button>
      </Box>

      <ScrollArea flex={1} p="md">
        {progress.length === 0 ? (
          <Flex h="60vh" align="center" justify="center" direction="column" gap="sm">
            <Text size="xl">📊</Text>
            <Text size="sm" c="white" fw={500}>No progress yet</Text>
            <Text size="xs" ta="center" style={{ color: 'rgba(255,255,255,0.4)', maxWidth: 280 }}>
              Upload notes and take a diagnostic quiz to start tracking your progress.
            </Text>
            <Button size="xs" variant="subtle" style={{ color: '#00c97a' }}
              onClick={() => window.location.href = '/upload'}>
              Upload Notes →
            </Button>
          </Flex>
        ) : (
          <Stack gap="lg" maw={780} mx="auto">

            {/* Overall summary */}
            <Paper p="lg" radius="md" style={{
              background: 'rgba(0,99,65,0.1)',
              border:     '1px solid rgba(0,99,65,0.3)',
            }}>
              <Group align="center" gap="xl">
                <RingProgress
                  size={100}
                  thickness={8}
                  roundCaps
                  sections={[
                    { value: totalTopics > 0 ? (totalStrong  / totalTopics) * 100 : 0, color: '#00c97a' },
                    { value: totalTopics > 0 ? (totalMedium  / totalTopics) * 100 : 0, color: '#F2A900' },
                    { value: totalTopics > 0 ? (totalWeak    / totalTopics) * 100 : 0, color: '#ff4d4d' },
                    { value: totalTopics > 0 ? (totalUnknown / totalTopics) * 100 : 0, color: 'rgba(255,255,255,0.1)' },
                  ]}
                  label={
                    <Text ta="center" fw={700} size="sm" c="white">
                      {overallScore}%
                    </Text>
                  }
                />
                <Stack gap="xs" flex={1}>
                  <Text fw={600} c="white">Overall Mastery</Text>
                  <Text size="xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {totalTested} of {totalTopics} topics tested
                  </Text>
                  <SimpleGrid cols={4} spacing="xs">
                    {[
                      { label: 'Strong',  count: totalStrong,  color: '#00c97a' },
                      { label: 'Medium',  count: totalMedium,  color: '#F2A900' },
                      { label: 'Weak',    count: totalWeak,    color: '#ff4d4d' },
                      { label: 'Unknown', count: totalUnknown, color: 'rgba(255,255,255,0.3)' },
                    ].map(s => (
                      <Box key={s.label} ta="center">
                        <Text fw={700} size="lg" style={{ color: s.color }}>{s.count}</Text>
                        <Text size="xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</Text>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Stack>
              </Group>
            </Paper>

            {/* Per-subject breakdown */}
            <Accordion
              variant="separated"
              styles={{
                item: {
                  background:   'rgba(255,255,255,0.03)',
                  border:       '1px solid rgba(0,99,65,0.2)',
                  borderRadius: '8px',
                },
                control: { color: 'white' },
                chevron: { color: 'rgba(255,255,255,0.4)' },
              }}
            >
              {progress.map(p => {
                const pct = p.total > 0
                  ? Math.round((p.strong * 100 + p.medium * 60) / p.total)
                  : 0

                return (
                  <Accordion.Item key={p.subject_id} value={String(p.subject_id)}>
                    <Accordion.Control>
                      <Group justify="space-between" pr="md">
                        <div>
                          <Text size="sm" fw={600} c="white">{p.title}</Text>
                          <Text size="xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {p.tested} / {p.total} topics tested · {new Date(p.created_at).toLocaleDateString()}
                          </Text>
                        </div>
                        <Group gap="xs">
                          <Badge size="sm" style={{
                            background: pct >= 70
                              ? 'rgba(0,201,122,0.2)'
                              : pct >= 40
                              ? 'rgba(242,169,0,0.2)'
                              : 'rgba(255,77,77,0.2)',
                            color: pct >= 70 ? '#00c97a' : pct >= 40 ? '#F2A900' : '#ff4d4d',
                          }}>
                            {pct}%
                          </Badge>
                          {p.weak > 0 && (
                            <Badge size="sm" style={{
                              background: 'rgba(255,77,77,0.15)',
                              color:      '#ff4d4d',
                            }}>
                              {p.weak} weak
                            </Badge>
                          )}
                        </Group>
                      </Group>
                    </Accordion.Control>

                    <Accordion.Panel>
                      <Stack gap="sm">

                        <SimpleGrid cols={4} spacing="xs">
                          {[
                            { label: 'Strong',  count: p.strong,  color: '#00c97a', bg: STATUS_BG.strong  },
                            { label: 'Medium',  count: p.medium,  color: '#F2A900', bg: STATUS_BG.medium  },
                            { label: 'Weak',    count: p.weak,    color: '#ff4d4d', bg: STATUS_BG.weak    },
                            { label: 'Unknown', count: p.unknown, color: 'rgba(255,255,255,0.3)', bg: STATUS_BG.unknown },
                          ].map(s => (
                            <Paper key={s.label} p="xs" radius="md" style={{
                              background: s.bg,
                              textAlign:  'center',
                            }}>
                              <Text fw={700} style={{ color: s.color }}>{s.count}</Text>
                              <Text size="xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</Text>
                            </Paper>
                          ))}
                        </SimpleGrid>

                        {(['weak', 'medium', 'strong', 'unknown'] as const).map(status => {
                          const group = p.topics.filter(t => t.status === status)
                          if (group.length === 0) return null
                          return (
                            <Box key={status}>
                              <Text size="xs" fw={600} mb={6} style={{
                                color:         STATUS_COLOR[status],
                                textTransform: 'capitalize',
                              }}>
                                {status} · {group.length}
                              </Text>
                              <Group gap="xs" wrap="wrap">
                                {group.map(t => (
                                  <Badge key={t.id} size="sm" style={{
                                    background: STATUS_BG[status],
                                    border:     `1px solid ${STATUS_COLOR[status]}33`,
                                    color:      STATUS_COLOR[status],
                                    fontWeight: 400,
                                  }}>
                                    {t.name}
                                    {t.score > 0 && (
                                      <Text span size="xs" ml={4} style={{ opacity: 0.6 }}>
                                        {Math.round(t.score)}%
                                      </Text>
                                    )}
                                  </Badge>
                                ))}
                              </Group>
                            </Box>
                          )
                        })}

                        <Button
                          size="xs" radius="md" mt="xs"
                          style={{
                            background: 'linear-gradient(135deg, #006341, #00855a)',
                            border:     'none',
                            fontWeight: 600,
                            alignSelf:  'flex-start',
                          }}
                          onClick={() => {
                            localStorage.setItem('subject_id', String(p.subject_id))
                            window.location.href = '/diagnostic'
                          }}
                        >
                          Retake Diagnostic →
                        </Button>

                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                )
              })}
            </Accordion>

          </Stack>
        )}
      </ScrollArea>
    </Flex>
  )
}