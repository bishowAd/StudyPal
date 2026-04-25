import { useEffect, useState } from 'react'
import {
  Box, Text, Paper, Button, Stack, Group,
  Badge, ScrollArea, Flex, Loader, SimpleGrid,
  RingProgress, Progress
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
  unknown: 'rgba(255,255,255,0.25)',
}

const STATUS_BG: Record<string, string> = {
  strong:  'rgba(0,201,122,0.12)',
  medium:  'rgba(242,169,0,0.12)',
  weak:    'rgba(255,77,77,0.12)',
  unknown: 'rgba(255,255,255,0.04)',
}

export default function ProgressPage() {
  const [progress,        setProgress]        = useState<SubjectProgress[]>([])
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState('')
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null)

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
      <Text size="sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading your progress...</Text>
    </Flex>
  )

  if (error) return (
    <Flex h="100vh" align="center" justify="center">
      <Text size="sm" c="red.4">{error}</Text>
    </Flex>
  )

  const totalSubjects = progress.length
  const totalTopics   = progress.reduce((s, p) => s + p.total,   0)
  const totalStrong   = progress.reduce((s, p) => s + p.strong,  0)
  const totalMedium   = progress.reduce((s, p) => s + p.medium,  0)
  const totalWeak     = progress.reduce((s, p) => s + p.weak,    0)
  const totalUnknown  = progress.reduce((s, p) => s + p.unknown, 0)
  const totalTested   = progress.reduce((s, p) => s + p.tested,  0)
  const overallScore  = totalTopics > 0
    ? Math.round((totalStrong * 100 + totalMedium * 60) / totalTopics)
    : 0

  const testedSubjects = progress.filter(p => p.tested > 0)

  return (
    <Flex direction="column" h="100vh" style={{ background: '#0a1a0f' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Box px="xl" py="md" style={{
        borderBottom:   '1px solid rgba(0,99,65,0.25)',
        flexShrink:     0,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <Text fw={700} size="lg" c="white">My Progress</Text>
          <Text size="xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Track your mastery across all subjects
          </Text>
        </div>
        <Button size="sm" radius="md"
          style={{
            background: 'linear-gradient(135deg, #006341, #00855a)',
            border:     'none',
            fontWeight: 600,
            boxShadow:  '0 4px 16px rgba(0,99,65,0.35)',
          }}
          onClick={() => window.location.href = '/knowledge-map'}>
          Take Diagnostic →
        </Button>
      </Box>

      <ScrollArea flex={1} px="xl" py="lg">
        {progress.length === 0 ? (
          <Flex h="60vh" align="center" justify="center" direction="column" gap="sm">
            <Text size="xl">🎓</Text>
            <Text size="sm" fw={600} c="white">Upload notes and start studying!</Text>
            <Text size="xs" ta="center" style={{ color: 'rgba(255,255,255,0.4)', maxWidth: 300 }}>
              Take a diagnostic quiz after uploading to see your mastery breakdown here.
            </Text>
            <Button size="xs" mt="xs" radius="md"
              style={{ background: 'linear-gradient(135deg,#006341,#00855a)', border: 'none' }}
              onClick={() => window.location.href = '/upload'}>
              Upload Notes →
            </Button>
          </Flex>
        ) : (
          <Stack gap="xl" maw={860} mx="auto">

            {/* ── Stats cards ──────────────────────────────────────────── */}
            <SimpleGrid cols={4} spacing="md">
              {[
                { icon: '📚', value: totalSubjects,     label: 'Subjects',       color: '#006341',  bg: 'rgba(0,99,65,0.15)',     border: 'rgba(0,99,65,0.35)'     },
                { icon: '✅', value: totalStrong,        label: 'Topics Mastered',color: '#00c97a',  bg: 'rgba(0,201,122,0.1)',    border: 'rgba(0,201,122,0.3)'    },
                { icon: '🎯', value: testedSubjects.length, label: 'Quizzes Taken', color: '#F2A900', bg: 'rgba(242,169,0,0.1)',   border: 'rgba(242,169,0,0.3)'    },
                {
                  icon:   '📈',
                  value:  `${overallScore}%`,
                  label:  'Avg Quiz Score',
                  color:  overallScore >= 70 ? '#00c97a' : overallScore >= 40 ? '#F2A900' : '#ff4d4d',
                  bg:     overallScore >= 70 ? 'rgba(0,201,122,0.1)' : overallScore >= 40 ? 'rgba(242,169,0,0.1)' : 'rgba(255,77,77,0.1)',
                  border: overallScore >= 70 ? 'rgba(0,201,122,0.3)' : overallScore >= 40 ? 'rgba(242,169,0,0.3)' : 'rgba(255,77,77,0.3)',
                },
              ].map(card => (
                <Paper key={card.label} p="lg" radius="md" style={{
                  background: card.bg,
                  border:     `1px solid ${card.border}`,
                }}>
                  <Text size="xl" mb={8}>{card.icon}</Text>
                  <Text fw={700} size="xl" style={{ color: card.color }}>{card.value}</Text>
                  <Text size="xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{card.label}</Text>
                </Paper>
              ))}
            </SimpleGrid>

            {/* ── Overall mastery ring ─────────────────────────────────── */}
            {totalTested > 0 && (
              <Paper p="lg" radius="md" style={{
                background: 'rgba(0,99,65,0.08)',
                border:     '1px solid rgba(0,99,65,0.25)',
              }}>
                <Text fw={600} c="white" mb="md">Overall Mastery</Text>
                <Group gap="xl" align="center">
                  <RingProgress
                    size={110} thickness={10} roundCaps
                    sections={[
                      { value: totalTopics > 0 ? (totalStrong  / totalTopics) * 100 : 0, color: '#00c97a' },
                      { value: totalTopics > 0 ? (totalMedium  / totalTopics) * 100 : 0, color: '#F2A900' },
                      { value: totalTopics > 0 ? (totalWeak    / totalTopics) * 100 : 0, color: '#ff4d4d' },
                      { value: totalTopics > 0 ? (totalUnknown / totalTopics) * 100 : 0, color: 'rgba(255,255,255,0.08)' },
                    ]}
                    label={<Text ta="center" fw={700} size="sm" c="white">{overallScore}%</Text>}
                  />
                  <Stack gap="xs" flex={1}>
                    <Text size="xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {totalTested} of {totalTopics} topics tested
                    </Text>
                    {[
                      { label: 'Strong',  count: totalStrong,  color: '#00c97a' },
                      { label: 'Medium',  count: totalMedium,  color: '#F2A900' },
                      { label: 'Weak',    count: totalWeak,    color: '#ff4d4d' },
                      { label: 'Unknown', count: totalUnknown, color: 'rgba(255,255,255,0.3)' },
                    ].map(s => (
                      <Group key={s.label} gap="sm">
                        <Box w={8} h={8} style={{ borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                        <Text size="xs" style={{ color: 'rgba(255,255,255,0.6)', width: 60 }}>{s.label}</Text>
                        <Text size="xs" fw={600} style={{ color: s.color }}>{s.count}</Text>
                      </Group>
                    ))}
                  </Stack>
                </Group>
              </Paper>
            )}

            {/* ── Subject breakdown table ───────────────────────────────── */}
            <Box>
              <Text fw={600} c="white" mb="sm">Subject Breakdown</Text>
              <Paper radius="md" style={{
                background: 'rgba(255,255,255,0.02)',
                border:     '1px solid rgba(0,99,65,0.2)',
                overflow:   'hidden',
              }}>
                {/* Header */}
                <Box px="md" py="sm" style={{
                  background:          'rgba(0,99,65,0.15)',
                  borderBottom:        '1px solid rgba(0,99,65,0.2)',
                  display:             'grid',
                  gridTemplateColumns: '2fr 80px 80px 80px 80px 120px',
                  gap:                 8,
                }}>
                  {['SUBJECT', 'TOPICS', 'MASTERED', 'LEARNING', 'UNKNOWN', 'PROGRESS'].map(h => (
                    <Text key={h} size="xs" fw={600} style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
                      {h}
                    </Text>
                  ))}
                </Box>

                {/* Rows */}
                {progress.map((p, i) => {
                  const pct        = p.total > 0 ? Math.round((p.strong * 100 + p.medium * 60) / p.total) : 0
                  const isExpanded = expandedSubject === p.subject_id

                  return (
                    <Box key={p.subject_id}>
                      <Box
                        px="md" py="sm"
                        onClick={() => setExpandedSubject(isExpanded ? null : p.subject_id)}
                        style={{
                          display:             'grid',
                          gridTemplateColumns: '2fr 80px 80px 80px 80px 120px',
                          gap:                 8,
                          alignItems:          'center',
                          borderBottom:        i < progress.length - 1 || isExpanded ? '1px solid rgba(0,99,65,0.1)' : 'none',
                          cursor:              'pointer',
                          background:          isExpanded ? 'rgba(0,99,65,0.1)' : 'transparent',
                          transition:          'background .15s',
                        }}
                      >
                        <Text size="sm" c="white" fw={500} lineClamp={1}>{p.title}</Text>
                        <Text size="sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{p.total}</Text>
                        <Text size="sm" fw={600} style={{ color: '#00c97a' }}>{p.strong}</Text>
                        <Text size="sm" fw={600} style={{ color: '#F2A900' }}>{p.medium + p.weak}</Text>
                        <Text size="sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{p.unknown}</Text>
                        <Group gap="xs" align="center">
                          <Progress
                            value={pct} size="sm" style={{ flex: 1 }}
                            styles={{
                              root:    { background: 'rgba(255,255,255,0.08)' },
                              section: { background: pct >= 70 ? '#00c97a' : pct >= 40 ? '#F2A900' : '#ff4d4d' },
                            }}
                          />
                          <Text size="xs" fw={600} style={{
                            color:    pct >= 70 ? '#00c97a' : pct >= 40 ? '#F2A900' : '#ff4d4d',
                            minWidth: 32,
                          }}>
                            {pct}%
                          </Text>
                        </Group>
                      </Box>

                      {/* Expanded topic breakdown */}
                      {isExpanded && (
                        <Box px="md" py="sm" style={{
                          background:   'rgba(0,0,0,0.2)',
                          borderBottom: i < progress.length - 1 ? '1px solid rgba(0,99,65,0.1)' : 'none',
                        }}>
                          <Stack gap="sm">
                            {(['weak', 'medium', 'strong', 'unknown'] as const).map(status => {
                              const group = p.topics.filter(t => t.status === status)
                              if (group.length === 0) return null
                              return (
                                <Box key={status}>
                                  <Text size="xs" fw={600} mb={6} style={{
                                    color: STATUS_COLOR[status], textTransform: 'capitalize',
                                  }}>
                                    {status} · {group.length} topics
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
                            <Button size="xs" radius="md" mt={4}
                              style={{
                                background: 'linear-gradient(135deg,#006341,#00855a)',
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
                        </Box>
                      )}
                    </Box>
                  )
                })}
              </Paper>
            </Box>

            {/* ── Recent quiz history ───────────────────────────────────── */}
            {testedSubjects.length > 0 && (
              <Box>
                <Text fw={600} c="white" mb="sm">Recent Quiz History</Text>
                <Paper radius="md" style={{
                  background: 'rgba(255,255,255,0.02)',
                  border:     '1px solid rgba(0,99,65,0.2)',
                  overflow:   'hidden',
                }}>
                  <Box px="md" py="sm" style={{
                    background:          'rgba(0,99,65,0.15)',
                    borderBottom:        '1px solid rgba(0,99,65,0.2)',
                    display:             'grid',
                    gridTemplateColumns: '2fr 100px 80px 120px',
                    gap:                 8,
                  }}>
                    {['SUBJECT', 'SCORE', '%', 'DATE'].map(h => (
                      <Text key={h} size="xs" fw={600} style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
                        {h}
                      </Text>
                    ))}
                  </Box>

                  {testedSubjects.map((p, i) => {
                    const pct = p.total > 0 ? Math.round((p.strong * 100 + p.medium * 60) / p.total) : 0
                    return (
                      <Box key={p.subject_id} px="md" py="sm" style={{
                        display:             'grid',
                        gridTemplateColumns: '2fr 100px 80px 120px',
                        gap:                 8,
                        alignItems:          'center',
                        borderBottom: i < testedSubjects.length - 1 ? '1px solid rgba(0,99,65,0.1)' : 'none',
                      }}>
                        <Text size="sm" c="white" lineClamp={1}>{p.title}</Text>
                        <Text size="sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{p.strong} / {p.tested}</Text>
                        <Text size="sm" fw={600} style={{
                          color: pct >= 70 ? '#00c97a' : pct >= 40 ? '#F2A900' : '#ff4d4d',
                        }}>
                          {pct}%
                        </Text>
                        <Text size="sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {new Date(p.created_at).toLocaleDateString()}
                        </Text>
                      </Box>
                    )
                  })}
                </Paper>
              </Box>
            )}

          </Stack>
        )}
      </ScrollArea>
    </Flex>
  )
}

