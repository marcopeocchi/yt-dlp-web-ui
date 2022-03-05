import { HddStackFill, Ethernet, Github, CheckSquareFill, XSquareFill } from 'react-bootstrap-icons';
import './Footer.css';

type Props = {
    freeSpace: string,
    statistics?: string,
    serverAddr: string,
    connected: boolean,
}

const isDesktop = window.innerWidth > 510;

export const Footer = ({ freeSpace, statistics, serverAddr, connected }: Props) => {
    return (
        <footer className="footer">
            <div className="container">
                <span className="pe-3">
                    <small>Made with ❤️ on 🌍</small>
                </span>
                <span className="px-3 separator">
                    <HddStackFill className="mb-1"></HddStackFill> {' '}
                    <small>{freeSpace ? `${freeSpace.trim()}iB` : '-'}</small>
                </span>
                {isDesktop ?
                    <span className="px-3 separator">
                        <Ethernet className="mb-1"></Ethernet> {' '}
                        <small>{serverAddr ? `${serverAddr}:3022` : 'not defined'}</small>
                    </span> :
                    null
                }
                <span className="px-3 separator">
                    <small title={connected ? 'Successfully connected!' : 'Can\'t connect to server'}>
                        {connected ?
                            <CheckSquareFill className="mb-1" style={{ color: '#03b703' }} /> :
                            <XSquareFill className="mb-1" style={{ color: '#e83a3a' }} />
                        }
                    </small>
                </span>
                <span className="float-end website" onClick={() => window.open('https://github.com/marcobaobao/yt-dlp-web-ui')}>
                    <Github className="mb-1"></Github>
                </span>
            </div>
        </footer >
    );
}