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
import { Socket } from "socket.io-client";
import { CliArguments } from "./classes";
import { StackableResult } from "./components/StackableResult";
import { serverStates } from "./events";
import { connected, downloading, finished } from "./features/status/statusSlice";
import { I18nBuilder } from "./i18n";
import { IDLMetadata, IDLMetadataAndPID, IMessage } from "./interfaces";
import { RootState } from "./stores/store";
import { isValidURL, toFormatArgs, updateInStateMap } from "./utils";

type Props = {
    socket: Socket
}

export default function Home({ socket }: Props) {
    // redux state
    const settings = useSelector((state: RootState) => state.settings)
    const status = useSelector((state: RootState) => state.status)
    const dispatch = useDispatch()

    // ephemeral state
    const [progressMap, setProgressMap] = useState(new Map<number, number>());
    const [messageMap, setMessageMap] = useState(new Map<number, IMessage>());
    const [downloadInfoMap, setDownloadInfoMap] = useState(new Map<number, IDLMetadata>());
    const [downloadFormats, setDownloadFormats] = useState<IDLMetadata>();
    const [pickedVideoFormat, setPickedVideoFormat] = useState('');
    const [pickedAudioFormat, setPickedAudioFormat] = useState('');
    const [pickedBestFormat, setPickedBestFormat] = useState('');

    const [downloadPath, setDownloadPath] = useState<number>(0);
    const [availableDownloadPaths, setAvailableDownloadPaths] = useState<string[]>([]);

    const [url, setUrl] = useState('');
    const [workingUrl, setWorkingUrl] = useState('');
    const [showBackdrop, setShowBackdrop] = useState(false);
    const [showToast, setShowToast] = useState(true);

    // memos
    const i18n = useMemo(() => new I18nBuilder(settings.language), [settings.language])
    const cliArgs = useMemo(() => new CliArguments().fromString(settings.cliArgs), [settings.cliArgs])

    /* -------------------- Effects -------------------- */
    /* WebSocket connect event handler*/
    useEffect(() => {
        socket.on('connect', () => {
            dispatch(connected())
            socket.emit('fetch-jobs')
            socket.emit('disk-space')
            socket.emit('retrieve-jobs')
        });
    }, [])

    /* Ask server for pending jobs / background jobs */
    useEffect(() => {
        socket.on('pending-jobs', (count: number) => {
            count === 0 ? setShowBackdrop(false) : setShowBackdrop(true)
        })
    }, [])

    /* Handle download information sent by server */
    useEffect(() => {
        socket.on('available-formats', (data: IDLMetadata) => {
            setShowBackdrop(false)
            setDownloadFormats(data);
        })
    }, [])

    /* Handle download information sent by server */
    useEffect(() => {
        socket.on('metadata', (data: IDLMetadataAndPID) => {
            setShowBackdrop(false)
            dispatch(downloading())
            updateInStateMap<number, IDLMetadata>(data.pid, data.metadata, downloadInfoMap, setDownloadInfoMap);
        })
    }, [])

    /* Handle per-download progress */
    useEffect(() => {
        socket.on('progress', (data: IMessage) => {
            if (data.status === serverStates.PROG_DONE || data.status === serverStates.PROC_ABORT) {
                setShowBackdrop(false)
                updateInStateMap<number, IMessage>(data.pid, serverStates.PROG_DONE, messageMap, setMessageMap);
                updateInStateMap<number, number>(data.pid, 0, progressMap, setProgressMap);
                socket.emit('disk-space')
                dispatch(finished())
                return;
            }
            updateInStateMap<number, IMessage>(data.pid, data, messageMap, setMessageMap);
            if (data.progress) {
                updateInStateMap<number, number>(data.pid,
                    Math.ceil(Number(data.progress.replace('%', ''))),
                    progressMap,
                    setProgressMap
                );
            }
        })
    }, [])

    useEffect(() => {
        fetch(`${window.location.protocol}//${settings.serverAddr}:${settings.serverPort}/tree`)
            .then(res => res.json())
            .then(data => {
                setAvailableDownloadPaths(data.flat)
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

        socket.emit('send-url', {
            url: immediate || url || workingUrl,
            path: availableDownloadPaths[downloadPath],
            params: cliArgs.toString() + toFormatArgs(codes),
        })
        setUrl('')
        setWorkingUrl('')
        setTimeout(() => {
            const input = document.getElementById('urlInput') as HTMLInputElement;
            input.value = '';
            setShowBackdrop(true);
            setDownloadFormats(undefined);
        }, 250);
    }

    /**
     * Retrive url from input and display the formats selection view
     */
    const sendUrlFormatSelection = () => {
        socket.emit('send-url-format-selection', {
            url: url,
        })
        setWorkingUrl(url)
        setUrl('')
        setPickedAudioFormat('');
        setPickedVideoFormat('');
        setPickedBestFormat('');
        setTimeout(() => {
            const input = document.getElementById('urlInput') as HTMLInputElement;
            input.value = '';
            setShowBackdrop(true)
        }, 250);
    }

    /**
     * Update the url state whenever the input value changes
     * @param e Input change event
     */
    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(e.target.value)
    }

    /**
     * Abort a specific download if id's provided, other wise abort all running ones.
     * @param id The download id / pid
     * @returns void
     */
    const abort = (id?: number) => {
        if (id) {
            updateInStateMap(id, null, downloadInfoMap, setDownloadInfoMap, true)
            socket.emit('abort', { pid: id })
            return
        }
        setDownloadFormats(undefined)
        socket.emit('abort-all')
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
                        <Grid container spacing={1}>
                            <Grid item xs={10}>
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
                            <Grid item xs={2}>
                                <FormControl fullWidth>
                                    <Select
                                        defaultValue={0}
                                        value={downloadPath}
                                        onChange={(e) => setDownloadPath(Number(e.target.value))}
                                    >

                                        {availableDownloadPaths.map((val: string, idx: number) => (
                                            <MenuItem key={idx} value={idx}>{val}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
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
            </Grid>
            {/* Format Selection grid */}
            {downloadFormats ? <Grid container spacing={2} mt={2}>
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
            </Grid> : null}
            <Grid container spacing={{ xs: 2, md: 2 }} columns={{ xs: 4, sm: 8, md: 12 }} pt={2}>
                { /*Super big brain flatMap moment*/
                    Array
                        .from<any>(messageMap)
                        .filter(flattened => [...flattened][0])
                        .filter(flattened => [...flattened][1].toString() !== serverStates.PROG_DONE)
                        .flatMap(message => (
                            <Grid item xs={4} sm={8} md={6} key={message[0]}>
                                {
                                    /*
                                        Message[0] => key, the pid which is shared with the progress and download Maps
                                        Message[1] => value, the actual formatted message sent from server
                                     */
                                }
                                <Fragment>
                                    <StackableResult
                                        formattedLog={message[1]}
                                        title={downloadInfoMap.get(message[0])?.title ?? ''}
                                        thumbnail={downloadInfoMap.get(message[0])?.thumbnail ?? ''}
                                        progress={progressMap.get(message[0]) ?? 0}
                                        stopCallback={() => abort(message[0])}
                                        resolution={
                                            settings.formatSelection
                                                ? ''
                                                : downloadInfoMap.get(message[0])?.best.resolution ?? ''
                                        }
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
        </Container>
    );
}