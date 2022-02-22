import { HddStackFill, Ethernet, Github, CheckSquareFill, XSquareFill } from 'react-bootstrap-icons';
import './Footer.css';

type Props = {
    freeSpace: string,
    statistics?: string,
    serverAddr: string,
    connected: boolean,
}

export const Footer = ({ freeSpace, statistics, serverAddr, connected }: Props) => {
    return (
        <footer className="footer">
            <div className="container">
                <span className="pe-3">
                    <small>Made with ❤️ on 🌍</small>
                </span>
                <span className="px-3 separator">
                    <HddStackFill></HddStackFill> {' '}
                    <small>{freeSpace ? `${freeSpace.trim()}iB` : '-'}</small>
                </span>
                <span className="px-3 separator">
                    <Ethernet></Ethernet> {' '}
                    <small>{serverAddr ? `${serverAddr}:3022` : 'not defined'}</small>
                </span>
                <span className="px-3 separator">
                    <small title={connected ? 'Successfully connected!' : 'Can\'t connect to server'}>
                        {connected ?
                            <CheckSquareFill style={{ color: '#03b703' }} /> :
                            <XSquareFill style={{ color: '#e83a3a' }} />
                        }
                    </small>
                </span>
                <span className="float-end website" onClick={() => window.open('https://github.com/marcobaobao/yt-dlp-web-ui')}>
                    <Github></Github>
                </span>
            </div>
        </footer >
    );
}