import { useEffect, useState } from 'react'
import {
  Box, Text, Paper, Button, Stack, Group,
  Badge, ScrollArea, Flex, SimpleGrid, Loader
} from '@mantine/core'

const getToken = () => localStorage.getItem('token')

interface Topic {
  id:     number
  name:   string
  status: string
  score:  number
}

interface Subject {
  id:          number
  title:       string
  created_at:  string
  topic_count: number
}

const STATUS_COLOR: Record<string, string> = {
  strong:  '#00c97a',
  medium:  '#F2A900',
  weak:    '#ff4d4d',
  unknown: 'rgba(255,255,255,0.3)',
}

const STATUS_BG: Record<string, string> = {
  strong:  'rgba(0,201,122,0.15)',
  medium:  'rgba(242,169,0,0.15)',
  weak:    'rgba(255,77,77,0.15)',
  unknown: 'rgba(255,255,255,0.05)',
}

export default function KnowledgeMap() {
  const [subjects,        setSubjects]        = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [topics,          setTopics]          = useState<Topic[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [loadingTopics,   setLoadingTopics]   = useState(false)
  const [error,           setError]           = useState('')

  useEffect(() => {
    fetch('http://localhost:5000/api/subjects/', {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(d => setSubjects(d.subjects || []))
      .catch(() => setError('Could not load subjects'))
      .finally(() => setLoadingSubjects(false))
  }, [])

  const selectSubject = async (subject: Subject) => {
    setSelectedSubject(subject)
    setLoadingTopics(true)
    setTopics([])
    try {
      const res  = await fetch(`http://localhost:5000/api/subjects/${subject.id}/topics`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      setTopics(data.topics || [])
    } catch {
      setError('Could not load topics')
    } finally {
      setLoadingTopics(false)
    }
  }

  const grouped = {
    strong:  topics.filter(t => t.status === 'strong'),
    medium:  topics.filter(t => t.status === 'medium'),
    weak:    topics.filter(t => t.status === 'weak'),
    unknown: topics.filter(t => t.status === 'unknown'),
  }

  return (
    <Flex h="100vh">

      {/* Left panel — subject list */}
      <Box w={260} style={{
        borderRight: '1px solid rgba(0,99,65,0.3)',
        flexShrink:  0,
      }}>
        <Box px="md" py="sm" style={{
          borderBottom: '1px solid rgba(0,99,65,0.3)',
        }}>
          <Text fw={600} size="sm" c="white">Knowledge Map</Text>
          <Text size="xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Your uploaded subjects
          </Text>
        </Box>

        <ScrollArea h="calc(100vh - 56px)" p="sm">
          {loadingSubjects ? (
            <Flex justify="center" mt="xl">
              <Loader size="sm" color="#006341" />
            </Flex>
          ) : subjects.length === 0 ? (
            <Stack align="center" mt="xl" gap="xs">
              <Text size="xl">📂</Text>
              <Text size="xs" ta="center" style={{ color: 'rgba(255,255,255,0.4)' }}>
                No subjects yet. Upload your notes first.
              </Text>
              <Button size="xs" variant="subtle"
                style={{ color: '#00c97a' }}
                onClick={() => window.location.href = '/upload'}>
                Upload Notes
              </Button>
            </Stack>
          ) : (
            <Stack gap="xs">
              {subjects.map(s => (
                <Paper
                  key={s.id}
                  p="sm"
                  radius="md"
                  onClick={() => selectSubject(s)}
                  style={{
                    background: selectedSubject?.id === s.id
                      ? 'rgba(0,99,65,0.25)'
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedSubject?.id === s.id
                      ? 'rgba(0,99,65,0.6)'
                      : 'rgba(0,99,65,0.15)'}`,
                    cursor:     'pointer',
                    transition: 'all .15s',
                  }}
                >
                  <Text size="sm" c="white" fw={500} lineClamp={1}>
                    {s.title}
                  </Text>
                  <Text size="xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {s.topic_count} topics · {new Date(s.created_at).toLocaleDateString()}
                  </Text>
                </Paper>
              ))}
            </Stack>
          )}
        </ScrollArea>
      </Box>

      {/* Right panel — topic map */}
      <Flex direction="column" flex={1} style={{ overflow: 'hidden' }}>  {/* ← fixed here */}

        {/* Header */}
        <Box px="md" py="sm" style={{
          borderBottom:   '1px solid rgba(0,99,65,0.3)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          flexShrink:     0,
        }}>
          <div>
            <Text fw={600} size="sm" c="white">
              {selectedSubject ? selectedSubject.title : 'Select a subject'}
            </Text>
            <Text size="xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {selectedSubject
                ? `${topics.length} topics · click a subject to explore`
                : 'Pick a subject from the left panel'}
            </Text>
          </div>
          {selectedSubject && (
            <Button
              size="xs" radius="md"
              style={{
                background: 'linear-gradient(135deg, #006341, #00855a)',
                border:     'none',
                fontWeight: 600,
              }}
              onClick={() => {
                localStorage.setItem('subject_id', String(selectedSubject.id))
                window.location.href = '/diagnostic'
              }}
            >
              Take Diagnostic →
            </Button>
          )}
        </Box>

        <ScrollArea flex={1} p="md">
          {!selectedSubject && (
            <Flex h="100%" align="center" justify="center" direction="column" gap="sm" mt={120}>
              <Text size="xl">🗺️</Text>
              <Text size="sm" c="white" fw={500}>Your Knowledge Map</Text>
              <Text size="xs" ta="center" style={{ color: 'rgba(255,255,255,0.4)', maxWidth: 280 }}>
                Select a subject from the left to see all its topics and your mastery level for each one.
              </Text>
            </Flex>
          )}

          {loadingTopics && (
            <Flex justify="center" mt="xl">
              <Loader size="sm" color="#006341" />
            </Flex>
          )}

          {selectedSubject && !loadingTopics && topics.length > 0 && (
            <Stack gap="lg">

              {/* Summary bar */}
              <SimpleGrid cols={4} spacing="sm">
                {(['strong', 'medium', 'weak', 'unknown'] as const).map(status => (
                  <Paper key={status} p="sm" radius="md" style={{
                    background: STATUS_BG[status],
                    border:     `1px solid ${STATUS_COLOR[status]}33`,
                    textAlign:  'center',
                  }}>
                    <Text size="xl" fw={700} style={{ color: STATUS_COLOR[status] }}>
                      {grouped[status].length}
                    </Text>
                    <Text size="xs" style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>
                      {status}
                    </Text>
                  </Paper>
                ))}
              </SimpleGrid>

              {/* Topic groups */}
              {(['weak', 'medium', 'strong', 'unknown'] as const).map(status => (
                grouped[status].length > 0 && (
                  <Box key={status}>
                    <Group gap="xs" mb="sm">
                      <Box w={8} h={8} style={{
                        borderRadius: '50%',
                        background:   STATUS_COLOR[status],
                        flexShrink:   0,
                      }} />
                      <Text size="sm" fw={600} style={{
                        color:         STATUS_COLOR[status],
                        textTransform: 'capitalize',
                      }}>
                        {status} · {grouped[status].length} topics
                      </Text>
                    </Group>
                    <Group gap="xs" wrap="wrap">
                      {grouped[status].map(topic => (
                        <Badge
                          key={topic.id}
                          size="md"
                          style={{
                            background: STATUS_BG[status],
                            border:     `1px solid ${STATUS_COLOR[status]}44`,
                            color:      STATUS_COLOR[status],
                            fontWeight: 400,
                          }}
                        >
                          {topic.name}
                          {topic.score > 0 && (
                            <Text span size="xs" ml={4} style={{ opacity: 0.7 }}>
                              {Math.round(topic.score)}%
                            </Text>
                          )}
                        </Badge>
                      ))}
                    </Group>
                  </Box>
                )
              ))}

            </Stack>
          )}

          {error && (
            <Text size="sm" c="red.4" ta="center" mt="xl">{error}</Text>
          )}
        </ScrollArea>
      </Flex>

    </Flex>
  )
}