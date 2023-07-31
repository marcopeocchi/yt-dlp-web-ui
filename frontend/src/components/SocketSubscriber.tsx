import { useEffect } from 'react'
import { useRecoilState, useRecoilValue } from 'recoil'
import { connectedState } from '../atoms/status'
import { useRPC } from '../hooks/useRPC'
import { useToast } from '../hooks/toast'
import { serverAddressAndPortState } from '../atoms/settings'
import { useI18n } from '../hooks/useI18n'

interface Props extends React.HTMLAttributes<HTMLBaseElement> { }

const SocketSubscriber: React.FC<Props> = ({ children }) => {
  const [isConnected, setIsConnected] = useRecoilState(connectedState)
  const serverAddressAndPort = useRecoilValue(serverAddressAndPortState)

  const { i18n } = useI18n()
  const { socket$ } = useRPC()
  const { pushMessage } = useToast()

  useEffect(() => {
    if (isConnected) { return }

    const sub = socket$.subscribe({
      next: () => {
        setIsConnected(true)
        pushMessage(
          `Connected to (${serverAddressAndPort})`,
          "success"
        )
      },
      error: (e) => {
        console.error(e)
        pushMessage(
          `${i18n.t('rpcConnErr')} (${serverAddressAndPort})`,
          "error"
        )
      }
    })
    return () => sub.unsubscribe()
  }, [isConnected])

  return (
    <>{children}</>
  )
}

export default SocketSubscriber