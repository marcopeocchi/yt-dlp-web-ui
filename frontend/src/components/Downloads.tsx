import { useEffect } from 'react'
import { useRecoilState, useRecoilValue } from 'recoil'
import { loadingDownloadsState } from '../atoms/downloads'
import { listViewState } from '../atoms/settings'
import { loadingAtom } from '../atoms/ui'
import DownloadsCardView from './DownloadsCardView'
import DownloadsListView from './DownloadsTableView'

const Downloads: React.FC = () => {
  const listView = useRecoilValue(listViewState)
  const loadingDownloads = useRecoilValue(loadingDownloadsState)

  const [isLoading, setIsLoading] = useRecoilState(loadingAtom)

  useEffect(() => {
    if (loadingDownloads) {
      setIsLoading(true)
      return
    }
    setIsLoading(false)
  }, [loadingDownloads, isLoading])

  if (listView) {
    return (
      <DownloadsListView />
    )
  }

  return (
    <DownloadsCardView />
  )
}

export default Downloads