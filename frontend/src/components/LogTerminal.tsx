import { Box, CircularProgress, Container, Paper, Typography } from '@mui/material'
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
    if (data.includes("level=ERROR")) {
      return { color: 'red' }
    }
    if (data.includes("level=WARN")) {
      return { color: 'orange' }
    }
    return {}
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
        {(logBuffer.length === 0) && <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyItems: 'center',
          alignItems: 'center',
          gap: 1
        }}>
          <CircularProgress color="primary" size={32} />
          <Typography py={1} variant="subtitle2" >
            {i18n.t('awaitingLogs')}
          </Typography>
        </Box>
        }
        <Box
          ref={boxRef}
          sx={{
            fontFamily: 'Roboto Mono',
            height: '75.5vh',
            overflowY: 'auto',
            overflowX: 'auto',
            fontSize: '15px'
          }}
        >
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