import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Box, Text, Paper, Button, Stack, Group,
  Badge, ScrollArea, Flex, Loader, Progress
} from '@mantine/core'

const getToken = () => localStorage.getItem('token')

interface Question {
  topic:       string
  question:    string
  options:     string[]
  answer:      string
  explanation: string
}

interface Subject {
  id:    number
  title: string
}

type Phase = 'loading' | 'ready' | 'quiz' | 'submitting' | 'done' | 'error'

export default function Diagnostic() {
  const [phase,     setPhase]     = useState<Phase>('loading')
  const [subject,   setSubject]   = useState<Subject | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [current,   setCurrent]   = useState(0)
  const [selected,  setSelected]  = useState<string | null>(null)
  const [revealed,  setRevealed]  = useState(false)
  const [results,   setResults]   = useState<{ topic: string; correct: boolean }[]>([])
  const [summary,   setSummary]   = useState<Record<string, number> | null>(null)
  const [error,     setError]     = useState('')

  const subjectId = localStorage.getItem('subject_id')

  // fix 1: declare generateQuiz before useEffect using useCallback
  const generateQuiz = useCallback(async () => {
    setPhase('loading')
    try {
      const res  = await fetch('http://localhost:5000/api/diagnostic/generate', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ subject_id: parseInt(subjectId!) }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); setPhase('error'); return }
      setSubject(data.subject)
      setQuestions(data.questions)
      setPhase('ready')
    } catch {
      setError('Could not reach the server.')
      setPhase('error')
    }
  }, [subjectId])

  // fix 2: only call generateQuiz in effect — no setState allowed in effect body
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current || !subjectId) return
    initialized.current = true
    generateQuiz()
  }, [subjectId, generateQuiz])

  const startQuiz = () => {
    setCurrent(0)
    setSelected(null)
    setRevealed(false)
    setResults([])
    setPhase('quiz')
  }

  const handleSelect = (option: string) => {
    if (revealed) return
    setSelected(option)
  }

  const handleConfirm = () => {
    if (!selected) return
    setRevealed(true)
  }

  const submitResults = useCallback(async (finalResults: { topic: string; correct: boolean }[]) => {
    setPhase('submitting')
    try {
      const res  = await fetch('http://localhost:5000/api/diagnostic/submit', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          subject_id: parseInt(subjectId!),
          results:    finalResults,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); setPhase('error'); return }
      setSummary(data.summary)
      setPhase('done')
    } catch {
      setError('Could not save results.')
      setPhase('error')
    }
  }, [subjectId])

  const handleNext = () => {
    const q          = questions[current]
    const correct    = selected === q.answer
    const newResults = [...results, { topic: q.topic, correct }]
    setResults(newResults)

    if (current + 1 >= questions.length) {
      submitResults(newResults)
    } else {
      setCurrent(current + 1)
      setSelected(null)
      setRevealed(false)
    }
  }

  const progress = questions.length > 0
    ? Math.round((current / questions.length) * 100)
    : 0

  const correctCount = results.filter(r => r.correct).length

  // ── No subject selected — derive error at render time, not in effect ────────
  if (!subjectId) return (
    <Flex h="100vh" align="center" justify="center" direction="column" gap="md">
      <Text size="xl">⚠️</Text>
      <Text size="sm" c="red.4" ta="center" maw={400}>
        No subject selected. Go to Knowledge Map and pick a subject.
      </Text>
      <Button size="xs" variant="subtle" style={{ color: '#00c97a' }}
        onClick={() => window.location.href = '/knowledge-map'}>
        ← Back to Knowledge Map
      </Button>
    </Flex>
  )

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === 'loading') return (
    <Flex h="100vh" align="center" justify="center" direction="column" gap="md">
      <Loader size="md" color="#006341" />
      <Text size="sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
        AI is generating your diagnostic quiz...
      </Text>
    </Flex>
  )

  // ── Error ─────────────────────────────────────────────────────────────────
  if (phase === 'error') return (
    <Flex h="100vh" align="center" justify="center" direction="column" gap="md">
      <Text size="xl">⚠️</Text>
      <Text size="sm" c="red.4" ta="center" maw={400}>{error}</Text>
      <Button size="xs" variant="subtle" style={{ color: '#00c97a' }}
        onClick={() => window.location.href = '/knowledge-map'}>
        ← Back to Knowledge Map
      </Button>
    </Flex>
  )

  // ── Ready ─────────────────────────────────────────────────────────────────
  if (phase === 'ready') return (
    <Flex h="100vh" align="center" justify="center">
      <Paper p="xl" radius="md" maw={480} w="100%" style={{
        background: 'rgba(0,99,65,0.1)',
        border:     '1px solid rgba(0,99,65,0.3)',
      }}>
        <Stack gap="md" align="center">
          <Text size="xl">🎯</Text>
          <Text fw={600} c="white" ta="center">{subject?.title}</Text>
          <Text size="sm" ta="center" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {questions.length} questions · one per topic · no time limit
          </Text>
          <Stack gap="xs" w="100%">
            {[
              '✅ Answer each multiple choice question',
              '📊 AI will classify each topic as Strong / Medium / Weak',
              '📚 Study Mode will focus on your weak areas',
            ].map((tip, i) => (
              <Text key={i} size="xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{tip}</Text>
            ))}
          </Stack>
          <Button fullWidth size="md" radius="md"
            style={{
              background: 'linear-gradient(135deg, #006341, #00855a)',
              border:     'none',
              fontWeight: 600,
              boxShadow:  '0 4px 20px rgba(0,99,65,0.4)',
            }}
            onClick={startQuiz}>
            Start Diagnostic →
          </Button>
        </Stack>
      </Paper>
    </Flex>
  )

  // ── Submitting ────────────────────────────────────────────────────────────
  if (phase === 'submitting') return (
    <Flex h="100vh" align="center" justify="center" direction="column" gap="md">
      <Loader size="md" color="#006341" />
      <Text size="sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Saving your results...
      </Text>
    </Flex>
  )

  // ── Done ──────────────────────────────────────────────────────────────────
  if (phase === 'done' && summary) return (
    <Flex h="100vh" align="center" justify="center">
      <ScrollArea h="100vh" w="100%">
        <Stack gap="md" maw={520} mx="auto" py="xl" px="md">

          <Text size="xl" ta="center">🏁</Text>
          <Text fw={600} c="white" ta="center" size="lg">Diagnostic Complete!</Text>
          <Text size="sm" ta="center" style={{ color: 'rgba(255,255,255,0.5)' }}>
            You got {correctCount} out of {questions.length} correct
          </Text>

          <Group grow>
            {[
              { label: 'Strong', count: summary.strong, color: '#00c97a', bg: 'rgba(0,201,122,0.15)' },
              { label: 'Medium', count: summary.medium, color: '#F2A900', bg: 'rgba(242,169,0,0.15)'  },
              { label: 'Weak',   count: summary.weak,   color: '#ff4d4d', bg: 'rgba(255,77,77,0.15)'  },
            ].map(s => (
              <Paper key={s.label} p="md" radius="md" style={{
                background: s.bg,
                border:     `1px solid ${s.color}33`,
                textAlign:  'center',
              }}>
                <Text size="xl" fw={700} style={{ color: s.color }}>{s.count}</Text>
                <Text size="xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</Text>
              </Paper>
            ))}
          </Group>

          <Stack gap="xs">
            {results.map((r, i) => (
              <Paper key={i} p="sm" radius="md" style={{
                background: r.correct ? 'rgba(0,201,122,0.08)' : 'rgba(255,77,77,0.08)',
                border:     `1px solid ${r.correct ? 'rgba(0,201,122,0.2)' : 'rgba(255,77,77,0.2)'}`,
              }}>
                <Group justify="space-between">
                  <Text size="xs" c="white">{r.topic}</Text>
                  <Badge size="sm" style={{
                    background: r.correct ? 'rgba(0,201,122,0.2)' : 'rgba(255,77,77,0.2)',
                    color:      r.correct ? '#00c97a' : '#ff4d4d',
                  }}>
                    {r.correct ? '✓ Correct' : '✗ Wrong'}
                  </Badge>
                </Group>
              </Paper>
            ))}
          </Stack>

          <Group grow>
            <Button radius="md" variant="outline"
              style={{ borderColor: 'rgba(0,99,65,0.4)', color: 'rgba(255,255,255,0.6)' }}
              onClick={() => window.location.href = '/knowledge-map'}>
              Knowledge Map
            </Button>
            <Button radius="md"
              style={{
                background: 'linear-gradient(135deg, #006341, #00855a)',
                border:     'none',
                fontWeight: 600,
              }}
              onClick={() => window.location.href = '/study'}>
              Study Weak Topics →
            </Button>
          </Group>

        </Stack>
      </ScrollArea>
    </Flex>
  )

  // ── Quiz ──────────────────────────────────────────────────────────────────
  const q = questions[current]

  return (
    <Flex h="100vh" direction="column">

      {/* Header */}
      <Box px="md" py="sm" style={{
        borderBottom:   '1px solid rgba(0,99,65,0.3)',
        flexShrink:     0,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <Text fw={600} size="sm" c="white">Diagnostic Quiz</Text>
          <Text size="xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {subject?.title}
          </Text>
        </div>
        <Text size="xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {current + 1} / {questions.length}
        </Text>
      </Box>

      {/* fix 3: Progress bar styles — use 'section' not 'bar' for Mantine v7 */}
      <Progress
        value={progress}
        size="xs"
        style={{ borderRadius: 0 }}
        styles={{ section: { background: 'linear-gradient(90deg, #006341, #00c97a)' } }}
      />

      <ScrollArea flex={1} p="md">
        <Stack gap="md" maw={600} mx="auto" py="md">

          <Badge size="sm" style={{
            background: 'rgba(0,99,65,0.2)',
            border:     '1px solid rgba(0,99,65,0.4)',
            color:      '#00c97a',
          }}>
            {q.topic}
          </Badge>

          <Text fw={600} c="white" size="md">{q.question}</Text>

          <Stack gap="xs">
            {q.options.map((option, i) => {
              const isSelected = selected === option
              const isCorrect  = option === q.answer
              let bg     = 'rgba(255,255,255,0.03)'
              let border = 'rgba(255,255,255,0.1)'
              let color  = 'rgba(255,255,255,0.7)'

              if (revealed) {
                if (isCorrect) {
                  bg = 'rgba(0,201,122,0.15)'; border = '#00c97a'; color = '#00c97a'
                } else if (isSelected && !isCorrect) {
                  bg = 'rgba(255,77,77,0.15)'; border = '#ff4d4d'; color = '#ff4d4d'
                }
              } else if (isSelected) {
                bg = 'rgba(0,99,65,0.25)'; border = '#006341'; color = 'white'
              }

              return (
                <Paper
                  key={i} p="md" radius="md"
                  onClick={() => handleSelect(option)}
                  style={{
                    background: bg,
                    border:     `1px solid ${border}`,
                    color,
                    cursor:     revealed ? 'default' : 'pointer',
                    transition: 'all .15s',
                  }}
                >
                  <Text size="sm">{option}</Text>
                </Paper>
              )
            })}
          </Stack>

          {revealed && (
            <Paper p="md" radius="md" style={{
              background: 'rgba(255,255,255,0.03)',
              border:     '1px solid rgba(255,255,255,0.08)',
            }}>
              <Text size="xs" fw={600} c="white" mb={4}>💡 Explanation</Text>
              <Text size="xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {q.explanation}
              </Text>
            </Paper>
          )}

          {!revealed ? (
            <Button
              fullWidth size="md" radius="md"
              disabled={!selected}
              onClick={handleConfirm}
              style={{
                background: selected ? 'linear-gradient(135deg, #006341, #00855a)' : undefined,
                border:     'none',
                fontWeight: 600,
                boxShadow:  selected ? '0 4px 20px rgba(0,99,65,0.4)' : undefined,
              }}
            >
              Confirm Answer
            </Button>
          ) : (
            <Button
              fullWidth size="md" radius="md"
              onClick={handleNext}
              style={{
                background: 'linear-gradient(135deg, #006341, #00855a)',
                border:     'none',
                fontWeight: 600,
                boxShadow:  '0 4px 20px rgba(0,99,65,0.4)',
              }}
            >
              {current + 1 >= questions.length ? 'See Results →' : 'Next Question →'}
            </Button>
          )}

        </Stack>
      </ScrollArea>
    </Flex>
  )
}