import {
  Backdrop,
  CircularProgress,
  Container
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useRecoilState, useRecoilValue } from 'recoil'
import { serverAddressAndPortState } from '../atoms/settings'
import { connectedState, freeSpaceBytesState, isDownloadingState } from '../atoms/status'
import DownloadDialog from '../components/DownloadDialog'
import Downloads from '../components/Downloads'
import HomeSpeedDial from '../components/HomeSpeedDial'
import Splash from '../components/Splash'
import { useToast } from '../hooks/toast'
import { useI18n } from '../hooks/useI18n'
import { useRPC } from '../hooks/useRPC'

export default function Home() {
  const isDownloading = useRecoilValue(isDownloadingState)
  const serverAddressAndPort = useRecoilValue(serverAddressAndPortState)

  const [, setFreeSpace] = useRecoilState(freeSpaceBytesState)
  const [isConnected, setIsDownloading] = useRecoilState(connectedState)

  const [openDialog, setOpenDialog] = useState(false)

  const { i18n } = useI18n()
  const { client } = useRPC()

  const { pushMessage } = useToast()

  useEffect(() => {
    if (isConnected) {
      client.running()
      const interval = setInterval(() => client.running(), 1000)
      return () => clearInterval(interval)
    }
  }, [isConnected])

  useEffect(() => {
    client
      .freeSpace()
      .then(bytes => setFreeSpace(bytes.result))
      .catch(() => {
        pushMessage(
          `${i18n.t('rpcConnErr')} (${serverAddressAndPort})`,
          "error"
        )
        setIsDownloading(false)
      })
  }, [])

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={!isDownloading}
      >
        <CircularProgress color="primary" />
      </Backdrop>
      <Splash />
      <Downloads />
      <HomeSpeedDial
        onOpen={() => setOpenDialog(true)}
      />
      <DownloadDialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false)
          setIsDownloading(false)
        }}
        onDownloadStart={() => {
          setOpenDialog(false)
          setIsDownloading(false)
        }}
      />
    </Container>
  )
}
