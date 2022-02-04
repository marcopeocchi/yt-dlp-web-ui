import { Fragment } from "react";
import {
    Row,
    Col,
    ProgressBar
} from "react-bootstrap";
import { Badge4kFill, Badge8kFill, BadgeHdFill } from "react-bootstrap-icons";

type Props = {
    formattedLog: string,
    title: string,
    thumbnail: string,
    resolution: string
    progress: number,
}

export function StackableResult({ formattedLog, title, thumbnail, resolution, progress }: Props) {

    const guessResolution = (xByY: string): JSX.Element => {
        if (!xByY) return null;
        if (xByY.includes('4320')) return (<Badge8kFill></Badge8kFill>);
        if (xByY.includes('2160')) return (<Badge4kFill></Badge4kFill>);
        if (xByY.includes('1080')) return (<BadgeHdFill></BadgeHdFill>);
        if (xByY.includes('720')) return (<BadgeHdFill></BadgeHdFill>);
        return null;
    }

    return (
        <Fragment>
            <div className="mt-2 status-box">
                <Row>
                    {title ? <p>{title}</p> : null}
                    <Col sm={9}>
                        <h6>Status</h6>
                        {!formattedLog ? <pre>Ready</pre> : null}
                        <pre id='status'>{formattedLog}</pre>
                    </Col>
                    <Col sm={3}>
                        <br />
                        <img className="img-fluid rounded" src={thumbnail ? thumbnail : ''} />
                    </Col>
                    <div className="float-end">
                        {guessResolution(resolution)}
                    </div>
                </Row>
            </div>
            {progress ?
                <ProgressBar className="container-padding mt-2" now={progress} variant="primary" /> :
                null
            }
        </Fragment>
    )
}