import { useEffect } from 'react'
import { useRecoilState, useRecoilValue } from 'recoil'
import { loadingDownloadsState } from '../atoms/downloads'
import { listViewState } from '../atoms/settings'
import { loadingAtom } from '../atoms/ui'
import DownloadsCardView from './DownloadsCardView'
import DownloadsTableView from './DownloadsTableView'

const Downloads: React.FC = () => {
  const tableView = useRecoilValue(listViewState)
  const loadingDownloads = useRecoilValue(loadingDownloadsState)

  const [isLoading, setIsLoading] = useRecoilState(loadingAtom)

  useEffect(() => {
    if (loadingDownloads) {
      return setIsLoading(true)
    }
    setIsLoading(false)
  }, [loadingDownloads, isLoading])

  if (tableView) return <DownloadsTableView />

  return <DownloadsCardView />
}

export default Downloads