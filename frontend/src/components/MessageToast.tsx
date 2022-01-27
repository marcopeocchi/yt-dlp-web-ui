import React from "react";
import {
    Toast,
} from "react-bootstrap";

type Props = {
    flag: boolean,
    callback: Function,
    children:
    | JSX.Element
    | string
}

export function MessageToast({ flag, callback, children }: Props) {
    return (
        <Toast
            show={flag}
            onClose={() => callback(false)}
            bg={'primary'}
            delay={1500}
            autohide
            className="mt-5"
        >
            <Toast.Body className="text-light">
                {children}
            </Toast.Body>
        </Toast>
    );
}