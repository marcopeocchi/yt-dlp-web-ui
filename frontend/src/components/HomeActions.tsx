import { Suspense, useState } from 'react'
import { useRecoilState } from 'recoil'
import { loadingAtom, optimisticDownloadsState } from '../atoms/ui'
import { useToast } from '../hooks/toast'
import DownloadDialog from './DownloadDialog'
import HomeSpeedDial from './HomeSpeedDial'
import TemplatesEditor from './TemplatesEditor'

const HomeActions: React.FC = () => {
  const [, setIsLoading] = useRecoilState(loadingAtom)
  const [optimistic, setOptimistic] = useRecoilState(optimisticDownloadsState)

  const [openDownload, setOpenDownload] = useState(false)
  const [openEditor, setOpenEditor] = useState(false)

  const { pushMessage } = useToast()

  // it's stupid because it will be overriden on the next server tick
  const handleOptimisticUpdate = (url: string) => setOptimistic([
    ...optimistic, {
      id: url,
      info: {
        created_at: new Date().toISOString(),
        thumbnail: '',
        title: url,
        url: url
      },
      progress: {
        eta: Number.MAX_SAFE_INTEGER,
        percentage: '0%',
        process_status: 0,
        speed: 0
      }
    }
  ])

  return (
    <>
      <HomeSpeedDial
        onDownloadOpen={() => setOpenDownload(true)}
        onEditorOpen={() => setOpenEditor(true)}
      />
      <Suspense>
        <DownloadDialog
          open={openDownload}
          onClose={() => {
            setOpenDownload(false)
            setIsLoading(true)
          }}
          // TODO: handle optimistic UI update
          onDownloadStart={(url) => {
            handleOptimisticUpdate(url)
            pushMessage(`Requested ${url}`, 'info')
            setOpenDownload(false)
            setIsLoading(true)
          }}
        />
      </Suspense>
      <TemplatesEditor
        open={openEditor}
        onClose={() => setOpenEditor(false)}
      />
    </>
  )
}

export default HomeActions