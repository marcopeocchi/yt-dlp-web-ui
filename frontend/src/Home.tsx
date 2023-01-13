import { FileUpload } from "@mui/icons-material";
import {
  Backdrop,
  Button,
  ButtonGroup,
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
  TextField,
  Typography
} from "@mui/material";
import { Buffer } from 'buffer';
import { Fragment, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { StackableResult } from "./components/StackableResult";
import { CliArguments } from "./features/core/argsParser";
import I18nBuilder from "./features/core/intl";
import { RPCClient } from "./features/core/rpcClient";
import { connected, setFreeSpace } from "./features/status/statusSlice";
import { RootState } from "./stores/store";
import { IDLMetadata, RPCResult } from "./types";
import { isValidURL, toFormatArgs } from "./utils";

type Props = {
  socket: WebSocket
}

export default function Home({ socket }: Props) {
  // redux state
  const settings = useSelector((state: RootState) => state.settings)
  const status = useSelector((state: RootState) => state.status)
  const dispatch = useDispatch()

  // ephemeral state
  const [activeDownloads, setActiveDownloads] = useState(new Array<RPCResult>());
  const [downloadFormats, setDownloadFormats] = useState<IDLMetadata>();
  const [pickedVideoFormat, setPickedVideoFormat] = useState('');
  const [pickedAudioFormat, setPickedAudioFormat] = useState('');
  const [pickedBestFormat, setPickedBestFormat] = useState('');

  const [customArgs, setCustomArgs] = useState('');
  const [downloadPath, setDownloadPath] = useState(0);
  const [availableDownloadPaths, setAvailableDownloadPaths] = useState<string[]>([]);

  const [fileNameOverride, setFilenameOverride] = useState('');

  const [url, setUrl] = useState('');
  const [workingUrl, setWorkingUrl] = useState('');

  const [showBackdrop, setShowBackdrop] = useState(false);
  const [showToast, setShowToast] = useState(true);

  // memos
  const i18n = useMemo(() => new I18nBuilder(settings.language), [settings.language])
  const client = useMemo(() => new RPCClient(socket), [settings.serverAddr, settings.serverPort])
  const cliArgs = useMemo(() => new CliArguments().fromString(settings.cliArgs), [settings.cliArgs])

  /* -------------------- Effects -------------------- */
  /* WebSocket connect event handler*/
  useEffect(() => {
    socket.onopen = () => {
      dispatch(connected())
      setCustomArgs(localStorage.getItem('last-input-args') ?? '')
      setFilenameOverride(localStorage.getItem('last-filename-override') ?? '')
    }
  }, [])

  useEffect(() => {
    if (status.connected) {
      client.running()
      const interval = setInterval(() => client.running(), 1000)
      return () => clearInterval(interval)
    }
  }, [status.connected])

  useEffect(() => {
    client.freeSpace()
      .then(bytes => dispatch(setFreeSpace(bytes.result)))
  }, [])

  useEffect(() => {
    socket.onmessage = (event) => {
      const res = client.decode(event.data)
      switch (typeof res.result) {
        case 'object':
          setActiveDownloads(
            (res.result ?? [])
              .filter((r: RPCResult) => !!r.info.url)
              .sort((a: RPCResult, b: RPCResult) => a.info.title.localeCompare(b.info.title))
          )
          break
        default:
          break
      }
    }
  }, [])

  useEffect(() => {
    if (activeDownloads.length > 0 && showBackdrop) {
      setShowBackdrop(false)
    }
  }, [activeDownloads, showBackdrop])

  useEffect(() => {
    client.directoryTree()
      .then(data => {
        setAvailableDownloadPaths(data.result)
      })
  }, [])

  /* -------------------- component functions -------------------- */

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
    const input = document.getElementById('urlInput') as HTMLInputElement;
    input.value = '';

    const filename = document.getElementById('customFilenameInput') as HTMLInputElement;
    if (filename) {
      filename.value = '';
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
                id="urlInput"
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
                settings.enableCustomArgs ?
                  <Grid item xs={12}>
                    <TextField
                      id="customArgsInput"
                      fullWidth
                      label={i18n.t('customArgsInput')}
                      variant="outlined"
                      onChange={handleCustomArgsChange}
                      value={customArgs}
                      disabled={!status.connected || (settings.formatSelection && downloadFormats != null)}
                    />
                  </Grid> :
                  null
              }
              {
                settings.fileRenaming ?
                  <Grid item xs={8}>
                    <TextField
                      id="customFilenameInput"
                      fullWidth
                      label={i18n.t('customFilename')}
                      variant="outlined"
                      value={fileNameOverride}
                      onChange={handleFilenameOverrideChange}
                      disabled={!status.connected || (settings.formatSelection && downloadFormats != null)}
                    />
                  </Grid> :
                  null
              }
              {
                settings.pathOverriding ?
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
                  </Grid> :
                  null
              }
            </Grid>
            <Grid container spacing={1} pt={2}>
              <Grid item>
                <Button
                  variant="contained"
                  disabled={url === ''}
                  onClick={() => settings.formatSelection ? sendUrlFormatSelection() : sendUrl()}
                >
                  {i18n.t('startButton')}
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
      {
        downloadFormats ? <Grid container spacing={2} mt={2}>
          <Grid item xs={12}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Grid container>
                <Grid item xs={12}>
                  <Typography variant="h6" component="div" pb={1}>
                    {downloadFormats.title}
                  </Typography>
                  {/* <Skeleton variant="rectangular" height={180} /> */}
                </Grid>
                <Grid item xs={12} pb={1}>
                  <img src={downloadFormats.thumbnail} height={260} width="100%" style={{ objectFit: 'cover' }} />
                </Grid>
                {/* video only */}
                <Grid item xs={12}>
                  <Typography variant="body1" component="div">
                    Best quality
                  </Typography>
                </Grid>
                <Grid item pr={2} py={1}>
                  <Button
                    variant="contained"
                    disabled={pickedBestFormat !== ''}
                    onClick={() => {
                      setPickedBestFormat(downloadFormats.best.format_id)
                      setPickedVideoFormat('')
                      setPickedAudioFormat('')
                    }}>
                    {downloadFormats.best.format_note || downloadFormats.best.format_id} - {downloadFormats.best.vcodec}+{downloadFormats.best.acodec}
                  </Button>
                </Grid>
                {/* video only */}
                {downloadFormats.formats.filter(format => format.acodec === 'none' && format.vcodec !== 'none').length ?
                  <Grid item xs={12}>
                    <Typography variant="body1" component="div">
                      Video data {downloadFormats.formats[1].acodec}
                    </Typography>
                  </Grid>
                  : null
                }
                {downloadFormats.formats
                  .filter(format => format.acodec === 'none' && format.vcodec !== 'none')
                  .map((format, idx) => (
                    <Grid item pr={2} py={1} key={idx}>
                      <Button
                        variant="contained"
                        onClick={() => {
                          setPickedVideoFormat(format.format_id)
                          setPickedBestFormat('')
                        }}
                        disabled={pickedVideoFormat === format.format_id}
                      >
                        {format.format_note} - {format.vcodec === 'none' ? format.acodec : format.vcodec}
                      </Button>
                    </Grid>
                  ))
                }
                {downloadFormats.formats.filter(format => format.acodec === 'none' && format.vcodec !== 'none').length ?
                  <Grid item xs={12}>
                    <Typography variant="body1" component="div">
                      Audio data
                    </Typography>
                  </Grid>
                  : null
                }
                {downloadFormats.formats
                  .filter(format => format.acodec !== 'none' && format.vcodec === 'none')
                  .map((format, idx) => (
                    <Grid item pr={2} py={1} key={idx}>
                      <Button
                        variant="contained"
                        onClick={() => {
                          setPickedAudioFormat(format.format_id)
                          setPickedBestFormat('')
                        }}
                        disabled={pickedAudioFormat === format.format_id}
                      >
                        {format.format_note} - {format.vcodec === 'none' ? format.acodec : format.vcodec}
                      </Button>
                    </Grid>
                  ))
                }
                <Grid item xs={12} pt={2}>
                  <ButtonGroup disableElevation variant="contained">
                    <Button
                      onClick={() => sendUrl()}
                      disabled={!pickedBestFormat && !(pickedAudioFormat || pickedVideoFormat)}
                    > Download
                    </Button>
                    <Button
                      onClick={() => {
                        setPickedAudioFormat('');
                        setPickedVideoFormat('');
                        setPickedBestFormat('');
                      }}
                    > Clear
                    </Button>
                  </ButtonGroup>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid> : null
      }
      <Grid container spacing={{ xs: 2, md: 2 }} columns={{ xs: 4, sm: 8, md: 12 }} pt={2}>
        {
          activeDownloads.map(download => (
            <Grid item xs={4} sm={8} md={6} key={download.id}>
              <Fragment>
                <StackableResult
                  title={download.info.title}
                  thumbnail={download.info.thumbnail}
                  percentage={download.progress.percentage}
                  stopCallback={() => abort(download.id)}
                  resolution={download.info.resolution ?? ''}
                  speed={download.progress.speed}
                  size={download.info.filesize_approx ?? 0}
                />
              </Fragment>
            </Grid>
          ))
        }
      </Grid>
      <Snackbar
        open={showToast === status.connected}
        autoHideDuration={1500}
        message="Connected"
        onClose={() => setShowToast(false)}
      />
    </Container >
  );
}