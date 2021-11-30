import { io } from "socket.io-client";
import React, { useState, useEffect } from "react";
import {
    Container,
    Row,
    Col,
    ProgressBar,
    InputGroup,
    FormControl,
    Button,
    ButtonGroup,
    Toast,
} from "react-bootstrap";
import { validateDomain, validateIP } from "./utils";
import { IDLInfo, IMessage } from "./interfaces";
import './App.css';

const socket = io(`http://${localStorage.getItem('server-addr') || 'localhost'}:3022`)

export function App() {

    const [progress, setProgress] = useState(0)
    const [message, setMessage] = useState('')
    const [halt, setHalt] = useState(false)
    const [url, setUrl] = useState('')
    const [showToast, setShowToast] = useState(false)
    const [invalidIP, setInvalidIP] = useState(false)
    const [updatedBin, setUpdatedBin] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark')
    const [downloadInfo, setDownloadInfo] = useState<IDLInfo>()

    useEffect(() => {
        socket.on('connect', () => {
            setShowToast(true)
        })
        return () => {
            socket.disconnect()
        }
    }, [])

    useEffect(() => {
        darkMode ?
            document.body.classList.add('dark') :
            document.body.classList.remove('dark')
    }, [darkMode])

    useEffect(() => {
        socket.on('info', (data: IDLInfo) => {
            setDownloadInfo(data)
        })
    }, [])

    useEffect(() => {
        socket.on('progress', (data: IMessage) => {
            setMessage(`operation: ${data.status || '...'} \nprogress: ${data.progress || '?'} \nsize: ${data.size || '?'} \nspeed: ${data.dlSpeed || '?'}`)
            if (data.status === 'Done!') {
                setHalt(false)
                setMessage('Done!')
                setProgress(0)
                return
            }
            setProgress(
                Math.ceil(Number(data.progress.replace('%', '')))
            )
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
        socket.emit('send-url', url)
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

    const abort = () => {
        setDownloadInfo({
            title: '',
            thumbnail: ''
        })
        socket.emit('abort')
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

    return (
        <Container>
            <Row>
                <Col lg={7} xs={12}>
                    <div className="mt-5" />
                    <h1 className="fw-bold">yt-dlp WebUI</h1>
                    <div className="mt-5" />

                    <div className="p-3 stack-box shadow">
                        <InputGroup>
                            <FormControl
                                className="url-input"
                                placeholder="YouTube or other supported service video url"
                                onChange={handleUrlChange}
                            />
                        </InputGroup>

                        <div className="mt-2 status-box">
                            <Row>
                                {downloadInfo ? <p>{downloadInfo.title}</p> : null}
                                <Col sm={9}>
                                    <h6>Status</h6>
                                    {!message ? <pre>Ready</pre> : null}
                                    <pre id='status'>{message}</pre>
                                </Col>
                                <Col sm={3}>
                                    <br />
                                    <img className="img-fluid rounded" src={downloadInfo?.thumbnail} />
                                </Col>
                            </Row>
                        </div>

                        <ButtonGroup className="mt-2">
                            <Button onClick={() => sendUrl()} disabled={halt}>Start</Button>
                            <Button active onClick={() => abort()}>Abort</Button>
                        </ButtonGroup>

                        {progress ? <ProgressBar className="container-padding mt-2" now={progress} variant="primary" /> : null}
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
                                onClick={() => toggleTheme()}>
                                {darkMode ? 'Light theme' : 'Dark theme'}
                            </Button>
                        </div> :
                        null
                    }

                    <div className="mt-5" />
                    <div>Once you close this page the download will continue in the background.</div>
                    <div>It won't be possible retriving the progress though.</div>
                    <div className="mt-5" />
                    <small>Made with ❤️ by Marcobaobao</small>
                </Col>
                <Col>
                    <Toast
                        show={showToast}
                        onClose={() => setShowToast(false)}
                        bg={'primary'}
                        delay={1500}
                        autohide
                        className="mt-5"
                    >
                        <Toast.Body className="text-light">
                            {`Connected to ${localStorage.getItem('server-addr') || 'localhost'}`}
                        </Toast.Body>
                    </Toast>
                    <Toast
                        show={updatedBin}
                        onClose={() => setUpdatedBin(false)}
                        bg={'primary'}
                        delay={1500}
                        autohide
                        className="mt-5"
                    >
                        <Toast.Body className="text-light">
                            Updated yt-dlp binary!
                        </Toast.Body>
                    </Toast>
                </Col>
            </Row>
        </Container>
    )
}