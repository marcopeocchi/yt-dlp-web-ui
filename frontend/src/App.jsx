import { io } from "socket.io-client";
import React, { useState, useEffect } from "react";
import { Container, ProgressBar, InputGroup, FormControl, Button } from "react-bootstrap";
import './App.css'

const socket = io('http://localhost:3000')

export function App() {
    useEffect(() => {
        socket.on('progress', data => {
            setMessage(data.trim())
            if (data.trim() === 'Done!') {
                setHalt(false)
                setProgress(0)
            }
            try {
                setProgress(Math.ceil(data.split(" ")[2].replace('%', '')))
            } catch (error) {
                console.log('finished or empty url')
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

    const abort = () => {
        socket.emit('abort')
        setHalt(false)
    }

    const [progress, setProgress] = useState(0)
    const [message, setMessage] = useState('')
    const [halt, setHalt] = useState(false)
    const [url, setUrl] = useState('')

    return (
        <Container>
            <div className="mt-5" />
            <h1>yt-dlp web ui</h1>

            <InputGroup className="mt-5">
                <FormControl placeholder="youtube video url" onChange={handleUrlChange} />
            </InputGroup>

            <div className="mt-2">
                <h6>Status</h6>
                <pre id='status'>{message}</pre>
            </div>

            <ProgressBar now={progress} />

            <Button className="my-5" variant="success" onClick={() => sendUrl()} disabled={halt}>Go!</Button>{' '}
            <Button variant="danger" onClick={() => abort()}>Abort</Button>

            <div className="mt-5" />
            <div>
                Once you close the page the download will continue in the background. It won't be possible retriving the progress though.
            </div>
        </Container>
    )
}