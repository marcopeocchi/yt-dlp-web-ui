import { Box, Container, Paper, Typography } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRecoilValue } from 'recoil'
import { serverURL } from '../atoms/settings'
import { useI18n } from '../hooks/useI18n'

const token = localStorage.getItem('token')

const LogTerminal: React.FC = () => {
  const serverAddr = useRecoilValue(serverURL)

  const { i18n } = useI18n()

  const [logBuffer, setLogBuffer] = useState<string[]>([])

  const boxRef = useRef<HTMLDivElement>(null)

  const eventSource = useMemo(
    () => new EventSource(`${serverAddr}/log/sse?token=${token}`),
    [serverAddr]
  )

  useEffect(() => {
    eventSource.addEventListener('log', event => {
      const msg: string[] = JSON.parse(event.data)
      setLogBuffer(buff => [...buff, ...msg].slice(-100))

      boxRef.current?.scrollTo(0, boxRef.current.scrollHeight)
    })

    // TODO: in dev mode it breaks sse
    return () => eventSource.close()
  }, [eventSource])

  const logEntryStyle = (data: string) => {
    const sx = {}

    if (data.includes("level=ERROR")) {
      return { ...sx, color: 'red' }
    }
    if (data.includes("level=WARN")) {
      return { ...sx, color: 'orange' }
    }

    return sx
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper
        sx={{
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography py={1} variant="h5" color="primary">
          {i18n.t('logsTitle')}
        </Typography>
        <Box
          ref={boxRef}
          sx={{
            fontFamily: 'Roboto Mono',
            height: '70.5vh',
            overflowY: 'auto',
            overflowX: 'auto',
            fontSize: '13.5px',
            fontWeight: '600',
            backgroundColor: 'black',
            color: 'white',
            padding: '0.5rem',
            borderRadius: '0.25rem'
          }}
        >
          {logBuffer.length === 0 && <Box >{i18n.t('awaitingLogs')}</Box>}
          {logBuffer.map((log, idx) => (
            <Box key={idx} sx={logEntryStyle(log)}>
              {log}
            </Box>
          ))}
        </Box>
      </Paper>
    </Container >
  )
}

export default LogTerminal