import React from "react";
import {
    InputGroup,
    FormControl,
    Button,
    ProgressBar
} from "react-bootstrap";

export function StackableInput(props: any) {
    return (
        <React.Fragment>
            <InputGroup className="mt-5">
                <FormControl
                    className="url-input"
                    placeholder="YouTube or other supported service video url"
                    onChange={props.handleUrlChange}
                />
            </InputGroup>

            <div className="mt-2 status-box">
                <h6>Status</h6>
                <pre id='status'>{props.message}</pre>
            </div>

            {props.progress ?
                <ProgressBar className="container-padding" now={props.progress} variant="danger" /> :
                null
            }

            {/* <Button className="my-5" variant="danger" onClick={() => sendUrl()} disabled={props.halt}>Go!</Button>{' '} */}
            {/* <Button variant="danger" active onClick={() => abort()}>Abort</Button>{' '} */}
        </React.Fragment>
    )
}