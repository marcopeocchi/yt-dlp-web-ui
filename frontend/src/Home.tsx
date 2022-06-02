import { Backdrop, Button, CircularProgress, Container, Grid, Paper, Snackbar, TextField, } from "@mui/material";
import React, { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Socket } from "socket.io-client";
import { StackableResult } from "./components/StackableResult";
import { connected, disconnected, downloading, finished } from "./features/status/statusSlice";
import { IDLInfo, IDLInfoBase, IDownloadInfo, IMessage } from "./interfaces";
import { RootState } from "./stores/store";
import { updateInStateMap, } from "./utils";

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

    const [url, setUrl] = useState('');
    const [showBackdrop, setShowBackdrop] = useState(false);

    /* -------------------- Effects -------------------- */
    /* WebSocket connect event handler*/
    useEffect(() => {
        socket.on('connect', () => {
            dispatch(connected());
            socket.emit('fetch-jobs')
            socket.emit('disk-space')
            socket.emit('retrieve-jobs');
        })
        return () => {
            socket.disconnect()
        }
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
            console.log(data)
        })
    }, [])

    /* Handle download information sent by server */
    useEffect(() => {
        socket.on('info', (data: IDLInfo) => {
            setShowBackdrop(false)
            dispatch(downloading())
            updateInStateMap(data.pid, data.info, downloadInfoMap, setDownloadInfoMap);
        })
    }, [])

    /* Handle per-download progress */
    useEffect(() => {
        socket.on('progress', (data: IMessage) => {
            if (data.status === 'Done!' || data.status === 'Aborted') {
                setShowBackdrop(false)
                updateInStateMap(data.pid, 'Done!', messageMap, setMessageMap);
                updateInStateMap(data.pid, 0, progressMap, setProgressMap);
                socket.emit('disk-space')
                dispatch(finished())
                return;
            }
            updateInStateMap(data.pid, data, messageMap, setMessageMap);
            if (data.progress) {
                updateInStateMap(data.pid, Math.ceil(Number(data.progress.replace('%', ''))), progressMap, setProgressMap)
            }
        })
    }, [])

    /* -------------------- component functions -------------------- */

    /**
     * Retrive url from input, cli-arguments from checkboxes and emits via WebSocket
     */
    const sendUrl = () => {
        socket.emit('send-url', {
            url: url,
            params: settings.cliArgs.toString(),
        })
        setUrl('')
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
        socket.emit('abort-all')
    }

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
                        />
                        <Grid container spacing={1} pt={2}>
                            <Grid item>
                                <Button
                                    variant="contained"
                                    disabled={url === ''}
                                    onClick={() => sendUrl()}
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
                                        title={downloadInfoMap.get(message[0])?.title}
                                        thumbnail={downloadInfoMap.get(message[0])?.thumbnail}
                                        resolution={downloadInfoMap.get(message[0])?.resolution}
                                        progress={progressMap.get(message[0])}
                                        stopCallback={() => abort(message[0])}
                                    />
                                </Fragment>
                            </Grid>
                        ))
                }
            </Grid>
            <Snackbar
                open={status.connected}
                autoHideDuration={1500}
                message="Connected"
                onClose={() => dispatch(disconnected())}
            />
        </Container>
    );
}