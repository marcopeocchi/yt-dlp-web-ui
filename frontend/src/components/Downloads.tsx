import { useRecoilState, useRecoilValue } from 'recoil'
import { activeDownloadsState } from '../atoms/downloads'
import { listViewState } from '../atoms/settings'
import { useRPC } from '../hooks/useRPC'
import { DownloadsCardView } from './DownloadsCardView'
import { DownloadsListView } from './DownloadsListView'
import { useEffect } from 'react'
import { connectedState, isDownloadingState } from '../atoms/status'
import { datetimeCompareFunc, isRPCResponse } from '../utils'
import { RPCResponse, RPCResult } from '../types'

const Downloads: React.FC = () => {
  const [active, setActive] = useRecoilState(activeDownloadsState)
  const isConnected = useRecoilValue(connectedState)
  const listView = useRecoilValue(listViewState)

  const { client, socket$ } = useRPC()

  const abort = (id?: string) => {
    if (id) {
      client.kill(id)
      return
    }
    client.killAll()
  }

  useEffect(() => {
    if (!isConnected) { return }

    const sub = socket$.subscribe((event: RPCResponse<RPCResult[]>) => {
      if (!isRPCResponse(event)) { return }
      if (!Array.isArray(event.result)) { return }

      setActive(
        (event.result || [])
          .filter(f => !!f.info.url)
          .sort((a, b) => datetimeCompareFunc(
            b.info.created_at,
            a.info.created_at,
          ))
      )
    })

    return () => sub.unsubscribe()
  }, [socket$, isConnected])

  const [, setIsDownloading] = useRecoilState(isDownloadingState)

  useEffect(() => {
    if (active) {
      setIsDownloading(true)
    }
  }, [active?.length])

  if (listView) {
    return (
      <DownloadsListView
        downloads={active ?? []}
        onStop={abort}
      />
    )
  }

  return (
    <DownloadsCardView
      downloads={active ?? []}
      onStop={abort}
    />
  )
}

export default Downloads