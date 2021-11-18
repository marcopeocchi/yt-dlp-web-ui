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
    Toast
} from "react-bootstrap";
import './App.css'

const socket = io(`http://${localStorage.getItem('server-addr') || 'localhost'}:3022`)

export function App() {

    const [progress, setProgress] = useState(0)
    const [message, setMessage] = useState('')
    const [halt, setHalt] = useState(false)
    const [url, setUrl] = useState('')
    const [showToast, setShowToast] = useState(false)
    const [showSettings, setShowSettings] = useState(false)

    useEffect(() => {
        socket.on('connect', () => {
            setShowToast(true)
        })
    }, [])

    useEffect(() => {
        socket.on('progress', data => {
            setMessage(data.trim())
            if (data.trim() === 'Done!') {
                setHalt(false)
                setProgress(0)
            }
            try {
                const _progress = Math.ceil(data.split(" ")[2].replace('%', ''))
                if (!isNaN(_progress)) {
                    setProgress(_progress)
                }
            } catch (error) {
                console.log('finished or empty url or aborted')
            }
        })
    }, [])

    const sendUrl = () => {
        setHalt(true)
        console.log(url)
        socket.emit('send-url', url)
    }

    const handleUrlChange = (e) => {
        setUrl(e.target.value)
    }

    const handleAddrChange = (e) => {
        localStorage.setItem('server-addr', e.target.value)
    }

    const abort = () => {
        socket.emit('abort')
        setHalt(false)
    }

    return (
        <Container>
            <Row>
                <Col lg={7} xs={12}>
                    <div className="mt-5" />
                    <h1>yt-dlp Web UI 🤠</h1>

                    <InputGroup className="mt-5">
                        <FormControl
                            className="url-input"
                            placeholder="YouTube or other supported service video url"
                            onChange={handleUrlChange}
                        />
                    </InputGroup>

                    <div className="mt-2 status-box">
                        <h6>Status</h6>
                        <pre id='status'>{message}</pre>
                    </div>

                    {progress ? <ProgressBar className="container-padding" now={progress} variant="success" /> : null}

                    <Button className="my-5" variant="success" onClick={() => sendUrl()} disabled={halt}>Go!</Button>{' '}
                    <Button variant="danger" onClick={() => abort()}>Abort</Button>{' '}
                    <Button variant="secondary" onClick={() => setShowSettings(!showSettings)}>Settings</Button>

                    {showSettings ?
                        <>
                            <h6>Server address</h6>
                            <InputGroup className="mb-3 url-input">
                                <InputGroup.Text>ws://</InputGroup.Text>
                                <FormControl
                                    defaultValue={localStorage.getItem('server-addr')}
                                    placeholder="Server address"
                                    aria-label="Server address"
                                    onChange={handleAddrChange}
                                />
                                <InputGroup.Text>:3022</InputGroup.Text>
                            </InputGroup>
                        </> :
                        null
                    }

                    <div className="mt-5" />
                    <div>Once you close the page the download will continue in the background.</div>
                    <div>It won't be possible retriving the progress though.</div>
                    <div className="mt-5" />
                    <small>Made with ❤️ by Marcobaobao</small>
                </Col>
                <Col>
                    <Toast
                        show={showToast}
                        onClose={() => setShowToast(false)}
                        bg={'success'}
                        delay={1000}
                        autohide
                        className="mt-5"
                    >
                        <Toast.Header>
                            <strong className="me-auto">Server</strong>
                            <small>Now</small>
                        </Toast.Header>
                        <Toast.Body>{`Connected to ${localStorage.getItem('server-addr')}`}</Toast.Body>
                    </Toast>
                </Col>
            </Row>
        </Container>
    )
}