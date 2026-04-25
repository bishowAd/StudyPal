import { useState, useRef } from 'react'
import {
  Box, Text, Paper, Button, TextInput,
  Stack, Group, Badge, ScrollArea, Flex
} from '@mantine/core'

const getToken = () => localStorage.getItem('token')

export default function Upload() {
  const [file,      setFile]      = useState<File | null>(null)
  const [title,     setTitle]     = useState('')
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState('')
  const [topics,    setTopics]    = useState<string[]>([])
  const [dragOver,  setDragOver]  = useState(false)
  const [done,      setDone]      = useState(false)
  const [subjectId, setSubjectId] = useState<number | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)

  const upload = async () => {
    if (!file) { setError('Please select a file'); return }

    setError('')
    setUploading(true)

    try {
      const form = new FormData()
      form.append('file',  file)
      form.append('title', title || file.name)

      const res  = await fetch('http://localhost:5000/api/upload/', {
        method:  'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body:    form,
      })
      const data = await res.json()

      if (!res.ok) {
        // Show real error message from backend
        setError(data.message || data.error || 'Upload failed')
        console.error('Upload error:', data)
        return
      }

      setTopics(data.topics)
      setSubjectId(data.subject.id)
      setDone(true)

    } catch {
      setError('Could not reach the server. Is the backend running?')
    } finally {
      setUploading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setTitle('')
    setTopics([])
    setDone(false)
    setError('')
    setSubjectId(null)
  }

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
          <Text fw={600} size="sm" c="white">Upload Notes</Text>
          <Text size="xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            AI will extract all key topics from your file
          </Text>
        </div>
        {done && (
          <Button size="xs" variant="subtle"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            onClick={reset}>
            ← Upload another
          </Button>
        )}
      </Box>

      <ScrollArea flex={1} p="md">
        <Stack gap="md" maw={680} mx="auto">

          {!done && (
            <>
              {/* Title input */}
              <TextInput
                placeholder="Subject name (optional)"
                value={title}
                onChange={e => setTitle(e.currentTarget.value)}
                radius="md"
                styles={{
                  input: {
                    background: 'rgba(255,255,255,0.05)',
                    border:     '1px solid rgba(0,99,65,0.3)',
                    color:      '#ffffff',
                  }
                }}
              />

              {/* Drop zone */}
              <Paper
                p={48} radius="md" ta="center"
                style={{
                  border:     `2px dashed ${dragOver ? '#006341' : 'rgba(0,99,65,0.3)'}`,
                  background: dragOver ? 'rgba(0,99,65,0.1)' : 'rgba(0,0,0,0.3)',
                  cursor:     uploading ? 'default' : 'pointer',
                  transition: 'all .15s',
                }}
                onDragOver={e  => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault()
                  setDragOver(false)
                  const f = e.dataTransfer.files[0]
                  if (f) setFile(f)
                }}
                onClick={() => !uploading && fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.docx,.pptx"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) setFile(f)
                    e.target.value = ''
                  }}
                />

                {uploading ? (
                  <Stack align="center" gap="sm">
                    <Text size="xl">⏳</Text>
                    <Text size="sm" c="white" fw={500}>Extracting topics...</Text>
                    <Text size="xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      AI is analyzing your notes
                    </Text>
                  </Stack>
                ) : file ? (
                  <Stack align="center" gap="xs">
                    <Text size="xl">
                      {file.name.endsWith('.pdf')  ? '📄' :
                       file.name.endsWith('.docx') ? '📝' : '📊'}
                    </Text>
                    <Text size="sm" c="white" fw={500}>{file.name}</Text>
                    <Text size="xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Click to change file
                    </Text>
                  </Stack>
                ) : (
                  <Stack align="center" gap="xs">
                    <Text size="xl" mb={4}>📂</Text>
                    <Text size="sm" c="white" fw={500}>
                      Drop your file here or click to browse
                    </Text>
                    <Text size="xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      PDF, Word or PowerPoint
                    </Text>
                    <Group gap="xs" mt="xs" justify="center">
                      <Badge size="sm" style={{ background: 'rgba(0,99,65,0.3)', color: '#00c97a' }}>PDF</Badge>
                      <Badge size="sm" style={{ background: 'rgba(0,99,65,0.3)', color: '#00c97a' }}>DOCX</Badge>
                      <Badge size="sm" style={{ background: 'rgba(0,99,65,0.3)', color: '#00c97a' }}>PPTX</Badge>
                    </Group>
                  </Stack>
                )}
              </Paper>

              {error && (
                <Text size="sm" c="red.4" ta="center">{error}</Text>
              )}

              <Button
                fullWidth size="md" radius="md"
                loading={uploading}
                disabled={!file}
                onClick={upload}
                style={{
                  background: file ? 'linear-gradient(135deg, #006341, #00855a)' : undefined,
                  border:     'none',
                  fontWeight: 600,
                  boxShadow:  file ? '0 4px 20px rgba(0,99,65,0.4)' : undefined,
                }}
              >
                Extract Topics
              </Button>
            </>
          )}

          {/* Topics result */}
          {done && (
            <>
              <Paper p="md" radius="md" style={{
                background: 'rgba(0,99,65,0.1)',
                border:     '1px solid rgba(0,99,65,0.3)',
              }}>
                <Group gap="xs" mb="sm">
                  <Text size="sm" c="white" fw={600}>
                    ✅ {topics.length} topics extracted
                  </Text>
                  <Badge size="sm" style={{
                    background: 'rgba(242,169,0,0.2)',
                    color:      '#F2A900',
                  }}>
                    Ready for diagnostic
                  </Badge>
                </Group>
                <Text size="xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  These are all the concepts the AI found in your notes.
                  Take the diagnostic quiz to find your weak spots.
                </Text>
              </Paper>

              {/* Topic badges */}
              <Group gap="xs" wrap="wrap">
                {topics.map((topic, i) => (
                  <Badge
                    key={i} size="md"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border:     '1px solid rgba(0,99,65,0.3)',
                      color:      '#ffffff',
                      fontWeight: 400,
                    }}
                  >
                    {topic}
                  </Badge>
                ))}
              </Group>

              {/* Next step */}
              <Button
                fullWidth size="md" radius="md"
                style={{
                  background: 'linear-gradient(135deg, #006341, #00855a)',
                  border:     'none',
                  fontWeight: 600,
                  boxShadow:  '0 4px 20px rgba(0,99,65,0.4)',
                }}
                onClick={() => {
                  localStorage.setItem('subject_id', String(subjectId))
                  window.location.href = '/diagnostic'
                }}
              >
                Take Diagnostic Quiz →
              </Button>
            </>
          )}

        </Stack>
      </ScrollArea>
    </Flex>
  )
}