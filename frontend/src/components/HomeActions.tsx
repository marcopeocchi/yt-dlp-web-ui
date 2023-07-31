import { useState } from 'react'
import { useRecoilState } from 'recoil'
import { loadingAtom } from '../atoms/ui'
import DownloadDialog from './DownloadDialog'
import HomeSpeedDial from './HomeSpeedDial'

const HomeActions: React.FC = () => {
  const [, setIsLoading] = useRecoilState(loadingAtom)
  const [openDialog, setOpenDialog] = useState(false)

  return (
    <>
      <HomeSpeedDial
        onOpen={() => setOpenDialog(true)}
      />
      <DownloadDialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false)
          setIsLoading(true)
        }}
        onDownloadStart={() => {
          setOpenDialog(false)
          setIsLoading(true)
        }}
      />
    </>
  )
}

export default HomeActions