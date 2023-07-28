import { FileUpload } from '@mui/icons-material'
import CloseIcon from '@mui/icons-material/Close'
import {
  Backdrop,
  Button,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  styled
} from '@mui/material'
import AppBar from '@mui/material/AppBar'
import Dialog from '@mui/material/Dialog'
import Slide from '@mui/material/Slide'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { TransitionProps } from '@mui/material/transitions'
import { Buffer } from 'buffer'
import {
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition
} from 'react'
import { useSelector } from 'react-redux'
import FormatsGrid from '../components/FormatsGrid'
import { CliArguments } from '../lib/argsParser'
import { I18nContext } from '../providers/i18nProvider'
import { RPCClientContext } from '../providers/rpcClientProvider'
import { RootState } from '../stores/store'
import type { DLMetadata } from '../types'
import { isValidURL, toFormatArgs } from '../utils'

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})

type Props = {
  open: boolean
  onClose: () => void
  onDownloadStart: () => void
}

export default function DownloadDialog({
  open,
  onClose,
  onDownloadStart
}: Props) {
  // redux state
  const settings = useSelector((state: RootState) => state.settings)
  const status = useSelector((state: RootState) => state.status)

  // ephemeral state
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

  const [isPlaylist, setIsPlaylist] = useState(false)

  // memos
  const cliArgs = useMemo(() =>
    new CliArguments().fromString(settings.cliArgs), [settings.cliArgs])

  // context
  const { i18n } = useContext(I18nContext)
  const { client } = useContext(RPCClientContext)

  // refs
  const urlInputRef = useRef<HTMLInputElement>(null)
  const customFilenameInputRef = useRef<HTMLInputElement>(null)

  // effects
  useEffect(() => {
    client.directoryTree()
      .then(data => {
        setAvailableDownloadPaths(data.result)
      })
  }, [])

  useEffect(() => {
    setCustomArgs(localStorage.getItem('last-input-args') ?? '')
    setFilenameOverride(localStorage.getItem('last-filename-override') ?? '')
  }, [])

  // transitions
  const [isPending, startTransition] = useTransition()

  /**
    * Retrive url from input, cli-arguments from checkboxes and emits via WebSocket
  */
  const sendUrl = (immediate?: string) => {
    const codes = new Array<string>()
    if (pickedVideoFormat !== '') codes.push(pickedVideoFormat)
    if (pickedAudioFormat !== '') codes.push(pickedAudioFormat)
    if (pickedBestFormat !== '') codes.push(pickedBestFormat)

    client.download(
      immediate || url || workingUrl,
      `${cliArgs.toString()} ${toFormatArgs(codes)} ${customArgs}`,
      availableDownloadPaths[downloadPath] ?? '',
      fileNameOverride,
      isPlaylist,
    )

    setUrl('')
    setWorkingUrl('')

    setTimeout(() => {
      resetInput()
      setDownloadFormats(undefined)
      onDownloadStart()
    }, 250)
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

    client.formats(url)
      ?.then(formats => {
        setDownloadFormats(formats.result)
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
    urlInputRef.current!.value = ''
    if (customFilenameInputRef.current) {
      customFilenameInputRef.current!.value = ''
    }
  }

  /* -------------------- styled components -------------------- */

  const Input = styled('input')({
    display: 'none',
  })

  return (
    <div>
      <Dialog
        fullScreen
        open={open}
        onClose={onClose}
        TransitionComponent={Transition}
      >
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={isPending}
        />
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={onClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              Download
            </Typography>
          </Toolbar>
        </AppBar>
        <Container sx={{ my: 4 }}>
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
                    disabled={
                      !status.connected
                      || (settings.formatSelection && downloadFormats != null)
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <label htmlFor="icon-button-file">
                            <Input
                              id="icon-button-file"
                              type="file"
                              accept=".txt"
                              onChange={parseUrlListFile}
                            />
                            <IconButton
                              color="primary"
                              aria-label="upload file"
                              component="span"
                            >
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
                <Grid container spacing={1} pt={2} justifyContent="space-between">
                  <Grid item>
                    <Button
                      variant="contained"
                      disabled={url === ''}
                      onClick={() => settings.formatSelection
                        ? startTransition(() => sendUrlFormatSelection())
                        : sendUrl()
                      }
                    >
                      {settings.formatSelection ? i18n.t('selectFormatButton') : i18n.t('startButton')}
                    </Button>
                  </Grid>
                  <Grid item>
                    <FormControlLabel
                      control={<Checkbox onChange={() => setIsPlaylist(state => !state)} />}
                      checked={isPlaylist}
                      label={i18n.t('playlistCheckbox')}
                    />
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
              setPickedAudioFormat('')
              setPickedVideoFormat('')
              setPickedBestFormat('')
            }}
            onSubmit={sendUrl}
            pickedBestFormat={pickedBestFormat}
            pickedVideoFormat={pickedVideoFormat}
            pickedAudioFormat={pickedAudioFormat}
          />}
        </Container>
      </Dialog>
    </div>
  )
}