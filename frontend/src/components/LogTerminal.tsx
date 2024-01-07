import { useState } from 'react'
import { useRecoilValue } from 'recoil'
import { webSocket } from 'rxjs/webSocket'
import { serverURLWS } from '../atoms/settings'
import { useSubscription } from '../hooks/observable'

const LogTerminal: React.FC = () => {
  const serverAddr = useRecoilValue(serverURLWS)

  const [logBuffer, setLogBuffer] = useState<string[]>([])

  useSubscription(
    webSocket<string[]>(`${serverAddr}/log/ws`),
    val => setLogBuffer(buff => [...buff, ...val])
  )

  return (
    <div>
      {logBuffer.map(log => (
        <div>{log}</div>
      ))}
    </div>
  )
}

export default LogTerminal