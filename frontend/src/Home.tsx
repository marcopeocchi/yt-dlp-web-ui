import { FileUpload } from '@mui/icons-material'
import {
  Alert,
  Backdrop,
  Button,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  styled,
  TextField
} from '@mui/material'
import { Buffer } from 'buffer'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DownloadsCardView } from './components/DownloadsCardView'
import { DownloadsListView } from './components/DownloadsListView'
import FormatsGrid from './components/FormatsGrid'
import { CliArguments } from './features/core/argsParser'
import I18nBuilder from './features/core/intl'
import { RPCClient, socket$ } from './features/core/rpcClient'
import { connected, setFreeSpace } from './features/status/statusSlice'
import { RootState } from './stores/store'
import type { DLMetadata, RPCResponse, RPCResult } from './types'
import { isValidURL, toFormatArgs } from './utils'

export default function Home() {
  // redux state
  const settings = useSelector((state: RootState) => state.settings)
  const status = useSelector((state: RootState) => state.status)
  const dispatch = useDispatch()

  // ephemeral state
  const [activeDownloads, setActiveDownloads] = useState<Array<RPCResult>>()
  const [downloadFormats, setDownloadFormats] = useState<DLMetadata>()
  const [pickedVideoFormat, setPickedVideoFormat] = useState('')
  const [pickedAudioFormat, setPickedAudioFormat] = useState('')
  const [pickedBestFormat, setPickedBestFormat] = useState('')

  const [customArgs, setCustomArgs] = useState('')
  const [downloadPath, setDownloadPath] = useState(0)
  const [availableDownloadPaths, setAvailableDownloadPaths] = useState<string[]>([])

  const [fileNameOverride, setFilenameOverride] = useState('')

  const [url, setUrl] = useState('')
  const [workingUrl, setWorkingUrl] = useState('')

  const [showBackdrop, setShowBackdrop] = useState(true)
  const [showToast, setShowToast] = useState(true)

  const [socketHasError, setSocketHasError] = useState(false)

  // memos
  const i18n = useMemo(() => new I18nBuilder(settings.language), [settings.language])
  const client = useMemo(() => new RPCClient(), [settings.serverAddr, settings.serverPort])
  const cliArgs = useMemo(() => new CliArguments().fromString(settings.cliArgs), [settings.cliArgs])

  // refs
  const urlInputRef = useRef<HTMLInputElement>(null)
  const customFilenameInputRef = useRef<HTMLInputElement>(null)

  /* -------------------- Effects -------------------- */

  /* WebSocket connect event handler*/
  useEffect(() => {
    if (!status.connected) {
      const sub = socket$.subscribe({
        next: () => {
          dispatch(connected())
          setCustomArgs(localStorage.getItem('last-input-args') ?? '')
          setFilenameOverride(localStorage.getItem('last-filename-override') ?? '')
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
    }
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
    if (status.connected) {
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
    }
  }, [socket$, status.connected])

  useEffect(() => {
    if (activeDownloads && activeDownloads.length >= 0) {
      setShowBackdrop(false)
    }
  }, [activeDownloads?.length])

  useEffect(() => {
    client.directoryTree()
      .then(data => {
        setAvailableDownloadPaths(data.result)
      })
  }, [])

  /* -------------------- callbacks-------------------- */

  /**
   * Retrive url from input, cli-arguments from checkboxes and emits via WebSocket
   */
  const sendUrl = (immediate?: string) => {
    const codes = new Array<string>();
    if (pickedVideoFormat !== '') codes.push(pickedVideoFormat);
    if (pickedAudioFormat !== '') codes.push(pickedAudioFormat);
    if (pickedBestFormat !== '') codes.push(pickedBestFormat);

    client.download(
      immediate || url || workingUrl,
      `${cliArgs.toString()} ${toFormatArgs(codes)} ${customArgs}`,
      availableDownloadPaths[downloadPath] ?? '',
      fileNameOverride
    )

    setUrl('')
    setWorkingUrl('')
    setShowBackdrop(true)

    setTimeout(() => {
      resetInput()
      setShowBackdrop(true)
      setDownloadFormats(undefined)
    }, 250);
  }

  /**
   * Retrive url from input and display the formats selection view
   */
  const sendUrlFormatSelection = () => {
    setWorkingUrl(url)
    setUrl('')
    setPickedAudioFormat('')
    setPickedVideoFormat('')
    setPickedBestFormat('')

    setShowBackdrop(true)

    client.formats(url)
      ?.then(formats => {
        setDownloadFormats(formats.result)
        setShowBackdrop(false)
        resetInput()
      })
  }

  /**
   * Update the url state whenever the input value changes
   * @param e Input change event
   */
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
  }

  /**
   * Update the filename override state whenever the input value changes
   * @param e Input change event
   */
  const handleFilenameOverrideChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilenameOverride(e.target.value)
    localStorage.setItem('last-filename-override', e.target.value)
  }

  /**
   * Update the custom args state whenever the input value changes
   * @param e Input change event
   */
  const handleCustomArgsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomArgs(e.target.value)
    localStorage.setItem("last-input-args", e.target.value)
  }

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

  const parseUrlListFile = (event: any) => {
    const urlList = event.target.files
    const reader = new FileReader()
    reader.addEventListener('load', $event => {
      const base64 = $event.target?.result!.toString().split(',')[1]
      Buffer.from(base64!, 'base64')
        .toString()
        .trimEnd()
        .split('\n')
        .filter(_url => isValidURL(_url))
        .forEach(_url => sendUrl(_url))
    })
    reader.readAsDataURL(urlList[0])
  }

  const resetInput = () => {
    urlInputRef.current!.value = '';
    if (customFilenameInputRef.current) {
      customFilenameInputRef.current!.value = '';
    }
  }

  /* -------------------- styled components -------------------- */

  const Input = styled('input')({
    display: 'none',
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={showBackdrop}
      >
        <CircularProgress color="primary" />
      </Backdrop>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Grid container>
              <TextField
                fullWidth
                ref={urlInputRef}
                label={i18n.t('urlInput')}
                variant="outlined"
                onChange={handleUrlChange}
                disabled={!status.connected || (settings.formatSelection && downloadFormats != null)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <label htmlFor="icon-button-file">
                        <Input id="icon-button-file" type="file" accept=".txt" onChange={parseUrlListFile} />
                        <IconButton color="primary" aria-label="upload file" component="span">
                          <FileUpload />
                        </IconButton>
                      </label>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid container spacing={1} sx={{ mt: 1 }}>
              {
                settings.enableCustomArgs &&
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={i18n.t('customArgsInput')}
                    variant="outlined"
                    onChange={handleCustomArgsChange}
                    value={customArgs}
                    disabled={!status.connected || (settings.formatSelection && downloadFormats != null)}
                  />
                </Grid>
              }
              {
                settings.fileRenaming &&
                <Grid item xs={8}>
                  <TextField
                    ref={customFilenameInputRef}
                    fullWidth
                    label={i18n.t('customFilename')}
                    variant="outlined"
                    value={fileNameOverride}
                    onChange={handleFilenameOverrideChange}
                    disabled={!status.connected || (settings.formatSelection && downloadFormats != null)}
                  />
                </Grid>
              }
              {
                settings.pathOverriding &&
                <Grid item xs={4}>
                  <FormControl fullWidth>
                    <InputLabel>{i18n.t('customPath')}</InputLabel>
                    <Select
                      label={i18n.t('customPath')}
                      defaultValue={0}
                      variant={'outlined'}
                      value={downloadPath}
                      onChange={(e) => setDownloadPath(Number(e.target.value))}
                    >
                      {availableDownloadPaths.map((val: string, idx: number) => (
                        <MenuItem key={idx} value={idx}>{val}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              }
            </Grid>
            <Grid container spacing={1} pt={2}>
              <Grid item>
                <Button
                  variant="contained"
                  disabled={url === ''}
                  onClick={() => settings.formatSelection ? sendUrlFormatSelection() : sendUrl()}
                >
                  {settings.formatSelection ? i18n.t('selectFormatButton') : i18n.t('startButton')}
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  onClick={() => abort()}
                >
                  {i18n.t('abortAllButton')}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid >
      {/* Format Selection grid */}
      {downloadFormats && <FormatsGrid
        downloadFormats={downloadFormats}
        onBestQualitySelected={(id) => {
          setPickedBestFormat(id)
          setPickedVideoFormat('')
          setPickedAudioFormat('')
        }}
        onVideoSelected={(id) => {
          setPickedVideoFormat(id)
          setPickedBestFormat('')
        }}
        onAudioSelected={(id) => {
          setPickedAudioFormat(id)
          setPickedBestFormat('')
        }}
        onClear={() => {
          setPickedAudioFormat('');
          setPickedVideoFormat('');
          setPickedBestFormat('');
        }}
        onSubmit={sendUrl}
        pickedBestFormat={pickedBestFormat}
        pickedVideoFormat={pickedVideoFormat}
        pickedAudioFormat={pickedAudioFormat}
      />}
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
    </Container>
  );
}
