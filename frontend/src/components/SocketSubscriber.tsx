import * as O from 'fp-ts/Option'
import { useMemo } from 'react'
import { useRecoilState, useRecoilValue } from 'recoil'
import { interval, share, take } from 'rxjs'
import { downloadsState } from '../atoms/downloads'
import { serverAddressAndPortState } from '../atoms/settings'
import { connectedState } from '../atoms/status'
import { useSubscription } from '../hooks/observable'
import { useToast } from '../hooks/toast'
import { useI18n } from '../hooks/useI18n'
import { useRPC } from '../hooks/useRPC'
import { datetimeCompareFunc, isRPCResponse } from '../utils'

interface Props extends React.HTMLAttributes<HTMLBaseElement> { }

const SocketSubscriber: React.FC<Props> = ({ children }) => {
  const [, setIsConnected] = useRecoilState(connectedState)
  const [, setDownloads] = useRecoilState(downloadsState)

  const serverAddressAndPort = useRecoilValue(serverAddressAndPortState)

  const { i18n } = useI18n()
  const { client } = useRPC()
  const { pushMessage } = useToast()

  const sharedSocket$ = useMemo(() => client.socket$.pipe(share()), [])
  const socketOnce$ = useMemo(() => sharedSocket$.pipe(take(1)), [])

  useSubscription(socketOnce$, () => {
    setIsConnected(true)
    pushMessage(
      `${i18n.t('toastConnected')} (${serverAddressAndPort})`,
      "success"
    )
  })

  useSubscription(sharedSocket$,
    (event) => {
      if (!isRPCResponse(event)) { return }
      if (!Array.isArray(event.result)) { return }

      if (event.result) {
        return setDownloads(
          O.of(event.result
            .filter(f => !!f.info.url).sort((a, b) => datetimeCompareFunc(
              b.info.created_at,
              a.info.created_at,
            ))
          )
        )
      }

      setDownloads(O.none)
    },
    (err) => {
      console.error(err)
      pushMessage(
        `${i18n.t('rpcConnErr')} (${serverAddressAndPort})`,
        "error"
      )
    }
  )

  useSubscription(interval(1000), () => client.running())

  return (
    <>{children}</>
  )
}

export default SocketSubscriber