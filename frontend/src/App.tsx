import { io } from "socket.io-client";
import React, { useState, useEffect, Fragment } from "react";
import {
    Container,
    Row,
    Col,
    ProgressBar,
    InputGroup,
    FormControl,
    Button,
    ButtonGroup,
} from "react-bootstrap";
import { validateDomain, validateIP } from "./utils";
import { IDLInfo, IDLInfoBase, IMessage } from "./interfaces";
import { MessageToast } from "./components/MessageToast";
import './App.css';

const socket = io(`http://${localStorage.getItem('server-addr') || 'localhost'}:3022`)

export function App() {

    const [progressMap, setProgressMap] = useState(new Map<number, number>());
    const [messageMap, setMessageMap] = useState(new Map<number, string>());
    const [downloadInfoMap, setDownloadInfoMap] = useState(new Map<number, IDLInfoBase>());

    const [halt, setHalt] = useState(false);
    const [url, setUrl] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [invalidIP, setInvalidIP] = useState(false);
    const [updatedBin, setUpdatedBin] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
    const [extractAudio, setExtractAudio] = useState(localStorage.getItem('-x') === 'true');

    const updateInStateMap = (k: number, v: any, target: Map<number, any>, callback: Function, remove: boolean = false) => {
        if (remove) {
            target.delete(k)
            callback(new Map(target))
            return;
        }
        callback(new Map(target.set(k, v)));
    }

    useEffect(() => {
        socket.on('connect', () => {
            setShowToast(true)
            socket.emit('fetch-jobs')
        })
        return () => {
            socket.disconnect()
        }
    }, [])

    useEffect(() => {
        socket.on('pending-jobs', () => {
            socket.emit('retrieve-jobs')
        })
    }, [])

    useEffect(() => {
        darkMode ?
            document.body.classList.add('dark') :
            document.body.classList.remove('dark')
    }, [darkMode])

    useEffect(() => {
        socket.on('info', (data: IDLInfo) => {
            updateInStateMap(data.pid, data.info, downloadInfoMap, setDownloadInfoMap)
        })
    }, [])


    useEffect(() => {
        socket.on('progress', (data: IMessage) => {
            if (data.status === 'Done!' || data.status === 'Aborted') {
                setHalt(false)
                updateInStateMap(
                    data.pid,
                    'Done!',
                    messageMap,
                    setMessageMap
                )
                updateInStateMap(data.pid, 0, progressMap, setProgressMap)
                return
            }
            updateInStateMap(
                data.pid,
                `operation: ${data.status || '...'} \nprogress: ${data.progress || '?'} \nsize: ${data.size || '?'} \nspeed: ${data.dlSpeed || '?'}`,
                messageMap,
                setMessageMap
            )
            if (data.progress) {
                updateInStateMap(data.pid, Math.ceil(Number(data.progress.replace('%', ''))), progressMap, setProgressMap)
            }
            // if (data.dlSpeed) {
            //     const event = new CustomEvent<number>("dlSpeed", { "detail": detectSpeed(data.dlSpeed) });
            //     document.dispatchEvent(event);
            // }
        })
    }, [])

    useEffect(() => {
        socket.on('updated', () => {
            setUpdatedBin(true)
            setHalt(false)
        })
    }, [])

    const sendUrl = () => {
        setHalt(true)
        socket.emit('send-url', {
            url: url,
            params: {
                xa: extractAudio
            },
        })
        setUrl('')
        const input: HTMLInputElement = document.getElementById('urlInput') as HTMLInputElement;
        input.value = '';
    }

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(e.target.value)
    }

    const handleAddrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        if (validateIP(input)) {
            setInvalidIP(false)
            localStorage.setItem('server-addr', input)
        } else if (validateDomain(input)) {
            setInvalidIP(false)
            localStorage.setItem('server-addr', input)
        } else {
            setInvalidIP(true)
        }
    }

    const abort = (id?: number) => {
        if (id) {
            updateInStateMap(id, null, downloadInfoMap, setDownloadInfoMap, true)
            socket.emit('abort', { pid: id })
            return
        }
        socket.emit('abort-all')
        setHalt(false)
    }

    const updateBinary = () => {
        setHalt(true)
        socket.emit('update-bin')
    }

    const toggleTheme = () => {
        if (darkMode) {
            localStorage.setItem('theme', 'light')
            setDarkMode(false)
        } else {
            localStorage.setItem('theme', 'dark')
            setDarkMode(true)
        }
    }

    const toggleExtractAudio = () => {
        if (extractAudio) {
            localStorage.setItem('-x', 'false')
            setExtractAudio(false)
        } else {
            localStorage.setItem('-x', 'true')
            setExtractAudio(true)
        }
    }

    return (
        <main>
            <Container className="pb-5">
                <Row>
                    <Col lg={7} xs={12}>
                        <div className="mt-5" />
                        <h1 className="fw-bold">yt-dlp WebUI</h1>
                        <div className="mt-5" />

                        <div className="p-3 stack-box shadow">
                            <InputGroup>
                                <FormControl
                                    id="urlInput"
                                    className="url-input"
                                    placeholder="YouTube or other supported service video url"
                                    onChange={handleUrlChange}
                                />
                            </InputGroup>
                            {
                                Array.from(messageMap).length === 0 ?
                                    <div className="mt-2 status-box">
                                        <Row>
                                            <Col sm={9}>
                                                <h6>Status</h6>
                                                <pre>Ready</pre>
                                            </Col>
                                        </Row>
                                    </div> : null
                            }
                            { /*Super big brain flatMap moment*/
                                Array.from(messageMap).flatMap(message => (
                                    <Fragment key={message[0]}>
                                        {
                                            /*
                                                Message[0] => key, the pid which is shared with the progress Map
                                                Message[1] => value, the actual formatted message sent from server
                                             */
                                        }
                                        {message[1] && message[1] !== 'Done!' ?
                                            <div className="mt-2 status-box">
                                                <Row>
                                                    {
                                                        downloadInfoMap.get(message[0]) ?
                                                            <p>{downloadInfoMap.get(message[0]).title}</p> :
                                                            null
                                                    }
                                                    <Col sm={9}>
                                                        <h6>Status</h6>
                                                        {!message[1] ? <pre>Ready</pre> : null}
                                                        <pre id='status'>{message[1]}</pre>
                                                    </Col>
                                                    <Col sm={3}>
                                                        <br />
                                                        <img className="img-fluid rounded" src={
                                                            downloadInfoMap.get(message[0]) ?
                                                                downloadInfoMap.get(message[0]).thumbnail :
                                                                ''
                                                        } />
                                                    </Col>
                                                </Row>
                                            </div> : null
                                        }
                                        {
                                            /*
                                                Gets the progress by indexing the map with the pid
                                             */
                                        }
                                        {progressMap.get(message[0]) ?
                                            <ProgressBar className="container-padding mt-2" now={progressMap.get(message[0])} variant="primary" /> :
                                            null
                                        }
                                        {message[1] && message[1] !== 'Done!' ?
                                            <Row>
                                                <Col>
                                                    <div className="px-2">
                                                        <Button variant="" className="float-end" active size="sm" onClick={() => abort(message[0])}>x</Button>
                                                    </div>
                                                </Col>
                                            </Row> : null
                                        }
                                    </Fragment>
                                ))
                            }

                            <ButtonGroup className="mt-2">
                                <Button onClick={() => sendUrl()} disabled={false}>Start</Button>
                                <Button active onClick={() => abort()}>Abort all</Button>
                            </ButtonGroup>

                        </div>

                        <div className="my-4">
                            <span className="settings" onClick={() => setShowSettings(!showSettings)}>Settings</span>
                        </div>

                        {showSettings ?
                            <div className="p-3 stack-box shadow">
                                <h6>Server address</h6>
                                <InputGroup className="mb-3 url-input" hasValidation>
                                    <InputGroup.Text>ws://</InputGroup.Text>
                                    <FormControl
                                        defaultValue={localStorage.getItem('server-addr') || 'localhost'}
                                        placeholder="Server address"
                                        aria-label="Server address"
                                        onChange={handleAddrChange}
                                        isInvalid={invalidIP}
                                        isValid={!invalidIP}
                                    />
                                    <InputGroup.Text>:3022</InputGroup.Text>
                                </InputGroup>
                                <Button onClick={() => updateBinary()} disabled={halt}>
                                    Update yt-dlp binary
                                </Button>{' '}
                                <Button
                                    variant={darkMode ? 'light' : 'dark'}
                                    onClick={() => toggleTheme()}
                                >
                                    {darkMode ? 'Light theme' : 'Dark theme'}
                                </Button>
                                <div className="pt-2">
                                    <input type="checkbox" name="-x" id="-x"
                                        onClick={() => toggleExtractAudio()} checked={extractAudio} />
                                    <label htmlFor="-x">&nbsp;Extract audio</label>
                                </div>
                            </div> :
                            null
                        }
                        <div className="mt-5" />
                        <div>
                            <small>
                                Once you close this page the download will continue in the background.
                            </small>
                        </div>
                    </Col>
                    <Col>
                        <MessageToast flag={showToast} callback={setShowToast}>
                            {`Connected to ${localStorage.getItem('server-addr') || 'localhost'}`}
                        </MessageToast>
                        <MessageToast flag={updatedBin} callback={setUpdatedBin}>
                            Updated yt-dlp binary!
                        </MessageToast>
                    </Col>
                </Row>
            </Container>
            <div className="container pb-5">
                <small>Made with ❤️ by Marcobaobao</small>
            </div>
        </main>
    )
}