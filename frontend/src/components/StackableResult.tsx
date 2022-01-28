import { Fragment } from "react";
import {
    Row,
    Col,
    ProgressBar
} from "react-bootstrap";

type Props = {
    formattedLog: string,
    title: string,
    thumbnail: string,
    progress: number,
}

export function StackableResult({ formattedLog, title, thumbnail, progress }: Props) {
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
                </Row>
            </div>
            {progress ?
                <ProgressBar className="container-padding mt-2" now={progress} variant="primary" /> :
                null
            }
        </Fragment>
    )
}