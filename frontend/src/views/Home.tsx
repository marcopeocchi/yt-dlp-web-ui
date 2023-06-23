import AddCircleIcon from '@mui/icons-material/AddCircle'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import FormatListBulleted from '@mui/icons-material/FormatListBulleted'
import {
  Alert,
  Backdrop,
  CircularProgress,
  Container,
  Snackbar,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  styled
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import DownloadDialog from '../components/DownloadDialog'
import { DownloadsCardView } from '../components/DownloadsCardView'
import { DownloadsListView } from '../components/DownloadsListView'
import Splash from '../components/Splash'
import { toggleListView } from '../features/settings/settingsSlice'
import { connected, setFreeSpace } from '../features/status/statusSlice'
import I18nBuilder from '../lib/intl'
import { RPCClient, socket$ } from '../lib/rpcClient'
import { RootState } from '../stores/store'
import type { RPCResponse, RPCResult } from '../types'

export default function Home() {
  // redux state
  const settings = useSelector((state: RootState) => state.settings)
  const status = useSelector((state: RootState) => state.status)
  const dispatch = useDispatch()

  // ephemeral state
  const [activeDownloads, setActiveDownloads] = useState<RPCResult[]>()

  const [showBackdrop, setShowBackdrop] = useState(true)
  const [showToast, setShowToast] = useState(true)

  const [openDialog, setOpenDialog] = useState(false)
  const [socketHasError, setSocketHasError] = useState(false)

  // memos
  const i18n = useMemo(() => new I18nBuilder(settings.language), [settings.language])
  const client = useMemo(() => new RPCClient(), [settings.serverAddr, settings.serverPort])

  /* -------------------- Effects -------------------- */

  /* WebSocket connect event handler*/
  useEffect(() => {
    if (status.connected) { return }

    const sub = socket$.subscribe({
      next: () => {
        dispatch(connected())
      },
      error: () => {
        setSocketHasError(true)
        setShowBackdrop(false)
      },
      complete: () => {
        setSocketHasError(true)
        setShowBackdrop(false)
      },
    })
    return () => sub.unsubscribe()
  }, [socket$, status.connected])

  useEffect(() => {
    if (status.connected) {
      client.running()
      const interval = setInterval(() => client.running(), 1000)
      return () => clearInterval(interval)
    }
  }, [status.connected])

  useEffect(() => {
    client.freeSpace().then(bytes => dispatch(setFreeSpace(bytes.result)))
  }, [])

  useEffect(() => {
    if (!status.connected) { return }

    const sub = socket$.subscribe((event: RPCResponse<RPCResult[]>) => {
      switch (typeof event.result) {
        case 'object':
          setActiveDownloads(
            (event.result ?? [])
              .filter((r) => !!r.info.url)
              .sort((a, b) => a.info.title.localeCompare(b.info.title))
          )
          break
        default:
          break
      }
    })
    return () => sub.unsubscribe()
  }, [socket$, status.connected])

  useEffect(() => {
    if (activeDownloads && activeDownloads.length >= 0) {
      setShowBackdrop(false)
    }
  }, [activeDownloads?.length])

  /**
   * Abort a specific download if id's provided, other wise abort all running ones.
   * @param id The download id / pid
   * @returns void
   */
  const abort = (id?: string) => {
    if (id) {
      client.kill(id)
      return
    }
    client.killAll()
  }


  /* -------------------- styled components -------------------- */

  const Input = styled('input')({
    display: 'none',
  })

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={showBackdrop}
      >
        <CircularProgress color="primary" />
      </Backdrop>
      {activeDownloads?.length === 0 &&
        <Splash />
      }
      {
        settings.listView ?
          <DownloadsListView downloads={activeDownloads ?? []} abortFunction={abort} /> :
          <DownloadsCardView downloads={activeDownloads ?? []} abortFunction={abort} />
      }
      <Snackbar
        open={showToast === status.connected}
        autoHideDuration={1500}
        onClose={() => setShowToast(false)}
      >
        <Alert variant="filled" severity="success">
          {`Connected to (${settings.serverAddr}:${settings.serverPort})`}
        </Alert>
      </Snackbar>
      <Snackbar open={socketHasError}>
        <Alert variant="filled" severity="error">
          {`${i18n.t('rpcConnErr')} (${settings.serverAddr}:${settings.serverPort})`}
        </Alert>
      </Snackbar>
      <SpeedDial
        ariaLabel="SpeedDial basic example"
        sx={{ position: 'absolute', bottom: 32, right: 32 }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<FormatListBulleted />}
          tooltipTitle={`Table view`}
          onClick={() => dispatch(toggleListView())}
        />
        <SpeedDialAction
          icon={<DeleteForeverIcon />}
          tooltipTitle={i18n.t('abortAllButton')}
          onClick={() => abort()}
        />
        <SpeedDialAction
          icon={<AddCircleIcon />}
          tooltipTitle={`New download`}
          onClick={() => setOpenDialog(true)}
        />
      </SpeedDial>
      <DownloadDialog open={openDialog} onClose={() => {
        setOpenDialog(false)
        activeDownloads?.length === 0
          ? setShowBackdrop(false)
          : setShowBackdrop(true)
      }} />
    </Container>
  )
}
