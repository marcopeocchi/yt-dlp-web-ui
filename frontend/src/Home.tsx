import React, { Fragment, useEffect, useState } from "react";
import {
    Backdrop,
    Button,
    ButtonGroup,
    CircularProgress,
    Container,
    Grid,
    IconButton,
    InputAdornment,
    Paper,
    Snackbar,
    styled,
    TextField,
    Typography,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { Socket } from "socket.io-client";
import { StackableResult } from "./components/StackableResult";
import { connected, downloading, finished } from "./features/status/statusSlice";
import { IDLInfo, IDLInfoBase, IDownloadInfo, IMessage } from "./interfaces";
import { RootState } from "./stores/store";
import { isValidURL, toFormatArgs, updateInStateMap, } from "./utils";
import { FileUpload } from "@mui/icons-material";
import { Buffer } from 'buffer';

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
    const [downloadInfoMap, setDownloadInfoMap] = useState(new Map<number, IDLInfoBase>());
    const [downloadFormats, setDownloadFormats] = useState<IDownloadInfo>();
    const [pickedVideoFormat, setPickedVideoFormat] = useState('');
    const [pickedAudioFormat, setPickedAudioFormat] = useState('');
    const [pickedBestFormat, setPickedBestFormat] = useState('');

    const [url, setUrl] = useState('');
    const [workingUrl, setWorkingUrl] = useState('');
    const [showBackdrop, setShowBackdrop] = useState(false);
    const [showToast, setShowToast] = useState(true);

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
        socket.on('available-formats', (data: IDownloadInfo) => {
            setShowBackdrop(false)
            setDownloadFormats(data);
        })
    }, [])

    /* Handle download information sent by server */
    useEffect(() => {
        socket.on('info', (data: IDLInfo) => {
            setShowBackdrop(false)
            dispatch(downloading())
            updateInStateMap<number, IDLInfoBase>(data.pid, data.info, downloadInfoMap, setDownloadInfoMap);
        })
    }, [])

    /* Handle per-download progress */
    useEffect(() => {
        socket.on('progress', (data: IMessage) => {
            if (data.status === 'Done!' || data.status === 'Aborted') {
                setShowBackdrop(false)
                updateInStateMap<number, IMessage>(data.pid, 'Done!', messageMap, setMessageMap);
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
            params: settings.cliArgs.toString() + toFormatArgs(codes),
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
                        <TextField
                            id="urlInput"
                            label={settings.i18n.t('urlInput')}
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
                        <Grid container spacing={1} pt={2}>
                            <Grid item>
                                <Button
                                    variant="contained"
                                    disabled={url === ''}
                                    onClick={() => settings.formatSelection ? sendUrlFormatSelection() : sendUrl()}
                                >
                                    {settings.i18n.t('startButton')}
                                </Button>
                            </Grid>
                            <Grid item>
                                <Button
                                    variant="contained"
                                    onClick={() => abort()}
                                >
                                    {settings.i18n.t('abortAllButton')}
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
                            <Grid item xs={12}>
                                <Typography variant="body1" component="div">
                                    Video data
                                </Typography>
                            </Grid>
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
                            <Grid item xs={12}>
                                <Typography variant="body1" component="div">
                                    Audio data
                                </Typography>
                            </Grid>
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
                        .from(messageMap)
                        .filter(flattened => [...flattened][0])
                        .filter(flattened => [...flattened][1].toString() !== 'Done!')
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
                                        title={downloadInfoMap.get(message[0])?.title ?? '...'}
                                        thumbnail={downloadInfoMap.get(message[0])?.thumbnail ?? '...'}
                                        resolution={downloadInfoMap.get(message[0])?.resolution ?? '...'}
                                        progress={progressMap.get(message[0]) ?? 0}
                                        stopCallback={() => abort(message[0])}
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