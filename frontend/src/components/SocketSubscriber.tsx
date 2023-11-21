import * as O from 'fp-ts/Option'
import { useEffect, useMemo } from 'react'
import { useRecoilState, useRecoilValue } from 'recoil'
import { take, timer } from 'rxjs'
import { downloadsState } from '../atoms/downloads'
import { serverAddressAndPortState } from '../atoms/settings'
import { connectedState } from '../atoms/status'
import { useSubscription } from '../hooks/observable'
import { useToast } from '../hooks/toast'
import { useI18n } from '../hooks/useI18n'
import { useRPC } from '../hooks/useRPC'
import { datetimeCompareFunc, isRPCResponse } from '../utils'

interface Props extends React.HTMLAttributes<HTMLBaseElement> { }

const SocketSubscriber: React.FC<Props> = () => {
  const [connected, setIsConnected] = useRecoilState(connectedState)
  const [, setDownloads] = useRecoilState(downloadsState)

  const serverAddressAndPort = useRecoilValue(serverAddressAndPortState)

  const { i18n } = useI18n()
  const { client } = useRPC()
  const { pushMessage } = useToast()

  const socketOnce$ = useMemo(() => client.socket$.pipe(take(1)), [])

  useEffect(() => {
    if (!connected) {
      socketOnce$.subscribe(() => {
        setIsConnected(true)
        pushMessage(
          `${i18n.t('toastConnected')} (${serverAddressAndPort})`,
          "success"
        )
      })
    }
  }, [connected])

  useSubscription(
    client.socket$,
    event => {
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
    err => {
      console.error(err)
      pushMessage(
        `${i18n.t('rpcConnErr')} (${serverAddressAndPort})`,
        "error"
      )
    }
  )

  useEffect(() => {
    if (connected) {
      const sub = timer(0, 1000).subscribe(() => client.running())

      return () => sub.unsubscribe()
    }
  }, [connected, client])

  return null
}

export default SocketSubscriber