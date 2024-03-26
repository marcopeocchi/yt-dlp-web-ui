import { useEffect } from 'react'
import { useRecoilState, useRecoilValue } from 'recoil'
import { activeDownloadsState, loadingDownloadsState } from '../atoms/downloads'
import { listViewState } from '../atoms/settings'
import { loadingAtom, totalDownloadSpeedState } from '../atoms/ui'
import DownloadsCardView from './DownloadsCardView'
import DownloadsTableView from './DownloadsTableView'

const Downloads: React.FC = () => {
  const tableView = useRecoilValue(listViewState)
  const loadingDownloads = useRecoilValue(loadingDownloadsState)

  const [isLoading, setIsLoading] = useRecoilState(loadingAtom)

  const downloads = useRecoilValue(activeDownloadsState)
  const [, setTotalDownloadSpeed] = useRecoilState(totalDownloadSpeedState)

  useEffect(() => {
    setTotalDownloadSpeed(
      downloads.map(d => d.progress.speed).reduce((curr, next) => curr + next)
    )
  }, [downloads])

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