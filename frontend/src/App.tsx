import { io } from "socket.io-client";
import React, { useState, useEffect, useRef, Fragment } from "react";
import {
    Container,
    Row,
    Col,
    InputGroup,
    FormControl,
    Button,
    ButtonGroup,
} from "react-bootstrap";
import { X, HddFill, GearFill, Translate } from "react-bootstrap-icons";
import { buildMessage, updateInStateMap, validateDomain, validateIP } from "./utils";
import { IDLInfo, IDLInfoBase, IMessage } from "./interfaces";
import { MessageToast } from "./components/MessageToast";
import { StackableResult } from "./components/StackableResult";
import { CliArguments } from "./classes";
import { I18nBuilder } from "./i18n";
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
    const [showLanguages, setShowLanguages] = useState(false);
    const [freeDiskSpace, setFreeDiskSpace] = useState('');

    const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
    const [language, setLanguage] = useState(localStorage.getItem('language') || 'english');

    const xaInput = useRef(null);
    const mtInput = useRef(null);

    /* -------------------- Init ----------------------- */

    const cliArgs = new CliArguments();

    if (!localStorage.getItem('cliArgs')) {
        localStorage.setItem('cliArgs', '')
    }

    cliArgs.fromString(localStorage.getItem('cliArgs'))

    const i18n = new I18nBuilder(language);

    /* -------------------- Effects -------------------- */

    /* WebSocket connect event handler*/
    useEffect(() => {
        socket.on('connect', () => {
            setShowToast(true)
            socket.emit('fetch-jobs')
            socket.emit('disk-space')
        })
        return () => {
            socket.disconnect()
        }
    }, [])

    /* Ask server for pending jobs / background jobs */
    useEffect(() => {
        socket.on('pending-jobs', () => {
            socket.emit('retrieve-jobs')
        })
    }, [])

    /* Handle download information sent by server */
    useEffect(() => {
        socket.on('info', (data: IDLInfo) => {
            updateInStateMap(data.pid, data.info, downloadInfoMap, setDownloadInfoMap);
        })
    }, [])

    /* Handle per-download progress */
    useEffect(() => {
        socket.on('progress', (data: IMessage) => {
            if (data.status === 'Done!' || data.status === 'Aborted') {
                setHalt(false);
                updateInStateMap(data.pid, 'Done!', messageMap, setMessageMap);
                updateInStateMap(data.pid, 0, progressMap, setProgressMap);
                socket.emit('disk-space')
                return;
            }
            updateInStateMap(data.pid, buildMessage(data), messageMap, setMessageMap);
            if (data.progress) {
                updateInStateMap(data.pid, Math.ceil(Number(data.progress.replace('%', ''))), progressMap, setProgressMap)
            }
        })
    }, [])

    /* Handle yt-dlp update success */
    useEffect(() => {
        socket.on('updated', () => {
            setUpdatedBin(true)
            setHalt(false)
        })
    }, [])

    /* Theme changer */
    useEffect(() => {
        darkMode ?
            document.body.classList.add('dark') :
            document.body.classList.remove('dark');
    }, [darkMode])

    /* Get disk free space */
    useEffect(() => {
        socket.on('free-space', (res: string) => {
            setFreeDiskSpace(res)
        })
    }, [])

    /* Change language */
    useEffect(() => {
        i18n.setLanguage(language)
    }, [language])

    /* -------------------- component functions -------------------- */

    /**
     * Retrive url from input, cli-arguments from checkboxes and emits via WebSocket
     */
    const sendUrl = () => {
        setHalt(true)
        socket.emit('send-url', {
            url: url,
            params: cliArgs.toString(),
        })
        setUrl('')
        const input = document.getElementById('urlInput') as HTMLInputElement;
        input.value = '';
    }

    /**
     * Update the url state whenever the input value changes
     * @param e Input change event
     */
    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(e.target.value)
    }

    /**
     * Update the server ip address state and localstorage whenever the input value changes.  
     * Validate the ip-addr then set.
     * @param e Input change event
     */
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
        setHalt(false)
    }

    /**
     * Send via WebSocket a message in order to update the yt-dlp binary from server
     */
    const updateBinary = () => {
        setHalt(true)
        socket.emit('update-bin')
    }

    /**
     * Theme toggler handler
     */
    const toggleTheme = () => {
        if (darkMode) {
            localStorage.setItem('theme', 'light')
            setDarkMode(false)
        } else {
            localStorage.setItem('theme', 'dark')
            setDarkMode(true)
        }
    }

    /**
     * Handle extract audio checkbox
     */
    const setExtractAudio = () => {
        if (cliArgs.extractAudio) {
            xaInput.current.checked = false;
            cliArgs.extractAudio = false;

            const lStorageItem = localStorage.getItem('cliArgs');
            localStorage.setItem('cliArgs', lStorageItem.replace('-x ', ''));
        } else {
            xaInput.current.checked = true;
            cliArgs.extractAudio = true;

            const lStorageItem = localStorage.getItem('cliArgs');
            localStorage.setItem('cliArgs', lStorageItem.concat('-x ', ''));
        }
    }

    /**
     * Handle no modified time header checkbox
     */
    const setNoMTime = () => {
        if (cliArgs.noMTime) {
            mtInput.current.checked = false;
            cliArgs.noMTime = false;

            const lStorageItem = localStorage.getItem('cliArgs');
            localStorage.setItem('cliArgs', lStorageItem.replace('--no-mtime ', ''));
        } else {
            mtInput.current.checked = true;
            cliArgs.noMTime = true;

            const lStorageItem = localStorage.getItem('cliArgs');
            localStorage.setItem('cliArgs', lStorageItem.concat('--no-mtime ', ''));
        }
    }

    /**
     * Language toggler handler 
     */
    const handleLanguageChage = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(event.target.value);
        setShowLanguages(false);
        localStorage.setItem('language', event.target.value);
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
                                    placeholder={i18n.t('urlInput')}
                                    onChange={handleUrlChange}
                                />
                            </InputGroup>
                            {
                                !Array.from(messageMap).length ?
                                    <div className="mt-2 status-box">
                                        <Row>
                                            <Col sm={9}>
                                                <h6>{i18n.t('statusTitle')}</h6>
                                                <pre>{i18n.t('statusReady')}</pre>
                                            </Col>
                                        </Row>
                                    </div> : null
                            }
                            { /*Super big brain flatMap moment*/
                                Array.from(messageMap).flatMap(message => (
                                    <Fragment key={message[0]}>
                                        {
                                            /*
                                                Message[0] => key, the pid which is shared with the progress and download Maps
                                                Message[1] => value, the actual formatted message sent from server
                                             */
                                        }
                                        {message[0] && message[1] && message[1] !== 'Done!' ?
                                            <Fragment>
                                                <StackableResult
                                                    formattedLog={message[1]}
                                                    title={downloadInfoMap.get(message[0])?.title}
                                                    thumbnail={downloadInfoMap.get(message[0])?.thumbnail}
                                                    resolution={downloadInfoMap.get(message[0])?.resolution}
                                                    progress={progressMap.get(message[0])} />
                                                <Row>
                                                    <Col>
                                                        <Button variant={darkMode ? 'dark' : 'light'} className="float-end" active size="sm" onClick={() => abort(message[0])}>
                                                            <X></X>
                                                        </Button>
                                                    </Col>
                                                </Row>
                                            </Fragment> : null
                                        }
                                    </Fragment>
                                ))
                            }

                            <ButtonGroup className="mt-2">
                                <Button onClick={() => sendUrl()} disabled={false}>{i18n.t('startButton')}</Button>
                                <Button active onClick={() => abort()}>{i18n.t('abortAllButton')}</Button>
                            </ButtonGroup>
                            <span className="text-muted float-end pt-3">
                                <HddFill></HddFill> {' '}
                                <small>{freeDiskSpace ? freeDiskSpace : '-'}</small>
                            </span>

                        </div>

                        <div className="my-4">
                            <span className="settings" onClick={() => setShowSettings(!showSettings)}>
                                <GearFill></GearFill>
                            </span>
                            {' '}
                            <span className="settings" onClick={() => setShowLanguages(!showLanguages)}>
                                <Translate></Translate>
                            </span>
                            {showLanguages ?
                                <select className="form-select mt-2" onChange={handleLanguageChage} defaultValue={language}>
                                    <option value="english">English</option>
                                    <option value="italian">Italian</option>
                                    <option value="chinese">Chinese</option>
                                    <option value="spanish">Spanish</option>
                                    <option value="russian">Russian</option>
                                </select>
                                : null
                            }
                        </div>


                        {showSettings ?
                            <div className="p-3 stack-box shadow">
                                <h6>{i18n.t('serverAddressTitle')}</h6>
                                <InputGroup className="mb-3 url-input" hasValidation>
                                    <InputGroup.Text>ws://</InputGroup.Text>
                                    <FormControl
                                        defaultValue={localStorage.getItem('server-addr') || 'localhost'}
                                        placeholder={i18n.t('serverAddressTitle')}
                                        aria-label={i18n.t('serverAddressTitle') || ''}
                                        onChange={handleAddrChange}
                                        isInvalid={invalidIP}
                                        isValid={!invalidIP}
                                    />
                                    <InputGroup.Text>:3022</InputGroup.Text>
                                </InputGroup>
                                <div className="pt-2">
                                    <input type="checkbox" name="-x" defaultChecked={cliArgs.extractAudio} ref={xaInput}
                                        onClick={setExtractAudio} />
                                    <label htmlFor="-x">&nbsp;
                                        {i18n.t('extractAudioCheckbox')}
                                    </label>
                                    <div></div>
                                    <input type="checkbox" name="-nomtime" defaultChecked={cliArgs.noMTime} ref={mtInput}
                                        onClick={setNoMTime} />
                                    <label htmlFor="-x">&nbsp;
                                        {i18n.t('noMTimeCheckbox')}
                                    </label>
                                </div>
                                <br />
                                <Button size="sm" onClick={() => updateBinary()} disabled={halt}>
                                    {i18n.t('updateBinButton')}
                                </Button>{' '}
                                <Button size="sm" variant={darkMode ? 'light' : 'dark'} onClick={() => toggleTheme()}>
                                    {darkMode ? i18n.t('lightThemeButton') : i18n.t('darkThemeButton')}
                                </Button>
                            </div> :
                            null
                        }

                        <div className="mt-5" />
                        <div>
                            <small>
                                {i18n.t('bgReminder')}
                            </small>
                        </div>
                    </Col>
                    <Col>
                        <MessageToast flag={showToast} callback={setShowToast}>
                            <>
                                {i18n.t('toastConnected')}{localStorage.getItem('server-addr') || 'localhost'}
                            </>
                        </MessageToast>
                        <MessageToast flag={updatedBin} callback={setUpdatedBin}>
                            {i18n.t('toastUpdated')}
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