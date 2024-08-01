import { Button, Container, Paper } from '@mui/material'
import { useState } from 'react'
import { interval } from 'rxjs'
import { useSubscription } from '../hooks/observable'
import { useRPC } from '../hooks/useRPC'
import { LiveStreamProgress } from '../types'

const LiveStreamMonitorView: React.FC = () => {
  const { client } = useRPC()

  const [progress, setProgress] = useState<LiveStreamProgress>()

  useSubscription(interval(1000), () => {
    client
      .progressLivestream()
      .then(r => setProgress(r.result))
  })

  const formatMicro = (microseconds: number) => {
    const ms = microseconds / 1_000_000
    let ss = ms / 1000

    const hrs = ss / 3600
    ss %= 3600

    const mts = ss / 60
    ss %= 60

    return `${hrs.toFixed(0)}:${mts.toFixed(0)}:${ss.toFixed(0)}`
  }

  const mapStatus = (status: number) => {
    switch (status) {
      case 0:
        return 'Waiting'
      case 1:
        return 'Downloading'
      case 2:
        return 'Completed'
      case 3:
        return 'Errored'
      default:
        return 'Unknown state'
    }
  }

  const exec = () => client.execLivestream('https://www.youtube.com/watch?v=skXfBd4xkZQ')

  const stop = () => client.killLivestream('https://www.youtube.com/watch?v=skXfBd4xkZQ')

  const stopAll = () => client.killAllLivestream()

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Paper sx={{
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 240,
      }}>
        <Button onClick={exec}>
          start
        </Button>
        <Button onClick={stop}>
          stop
        </Button>
        <Button onClick={stopAll}>
          stop all
        </Button>
        {progress && Object.keys(progress).map(k => (
          <div key={k}>
            <div>{k}</div>
            <div>{mapStatus(progress[k].Status)}</div>
            <div>{formatMicro(Number(progress[k].WaitTime))}</div>
            <div>{new Date(progress[k].LiveDate).toLocaleString()}</div>
          </div>
        ))}
      </Paper>
    </Container>
  )
}

export default LiveStreamMonitorView